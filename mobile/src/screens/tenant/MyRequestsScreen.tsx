import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ScreenContainer } from '../../components/ScreenContainer'
import { StatusBadge } from '../../components/StatusBadge'
import { Modal } from '../../components/common/Modal'
import { TenantRequestsStackParamList } from '../../navigation/types'
import { ROUTES } from '../../navigation/routes'
import { api, RequestItem } from '../../services/api'
import { useAppAlert } from '../../hooks/useAppAlert'
import { subscribeNotifications } from '../../services/notificationsSocket'
import { colors, radius, spacing, typography } from '../../utils/theme'

type Props = NativeStackScreenProps<TenantRequestsStackParamList, 'MyRequestsList'>

interface TenantAssignmentLookup {
  propertyId: string
  propertyName?: string
  unitId: string
  unitNumber: string
}

export const MyRequestsScreen = ({ navigation }: Props) => {
  const { showToast } = useAppAlert()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const loadRequests = async () => {
    try {
      const [reqRes, assignmentRes] = await Promise.all([
        api.get<RequestItem[]>('/requests'),
        api.get<TenantAssignmentLookup>('/auth/me-assignment').catch(() => null)
      ])

      const assignment = assignmentRes?.data

      const normalizedRequests = reqRes.data.map((request) => ({
        ...request,
        propertyName:
          request.propertyName ||
          (assignment && request.propertyId === assignment.propertyId
            ? assignment.propertyName
            : undefined),
        unitNumber:
          request.unitNumber ||
          (assignment && request.unitId === assignment.unitId ? assignment.unitNumber : undefined)
      }))

      setRequests(normalizedRequests)
    } catch (error: unknown) {
      setRequests([])

      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      const statusCode = (error as { response?: { status?: number } })?.response?.status
      const fallbackMessage = (error as { message?: string })?.message
      const statusPrefix = statusCode ? `(${statusCode}) ` : ''

      showToast({
        type: 'error',
        message: `${statusPrefix}${responseMessage || fallbackMessage || 'Unable to load requests. Please try again.'}`
      })
    }
  }

  useFocusEffect(
    useCallback(() => {
      void loadRequests()

      const unsubscribe = subscribeNotifications(() => {
        void loadRequests()
      })

      return () => {
        unsubscribe()
      }
    }, [])
  )

  const promptDelete = (requestId: string) => {
    setSelectedRequestId(requestId)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedRequestId) {
      setIsDeleteOpen(false)
      return
    }

    try {
      await api.delete(`/requests/${selectedRequestId}`)
      setRequests((current) => current.filter((item) => item._id !== selectedRequestId))
    } catch (error: unknown) {
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      const statusCode = (error as { response?: { status?: number } })?.response?.status
      const fallbackMessage = (error as { message?: string })?.message
      const statusPrefix = statusCode ? `(${statusCode}) ` : ''

      showToast({
        type: 'error',
        message: `${statusPrefix}${responseMessage || fallbackMessage || 'Unable to delete request. Please try again.'}`
      })
    } finally {
      setIsDeleteOpen(false)
      setSelectedRequestId(null)
    }
  }

  return (
    <ScreenContainer onRefresh={loadRequests}>
      <Text style={styles.title}>My Requests</Text>

      {requests.map((request) => (
        <Pressable
          key={request._id}
          style={styles.card}
          onPress={() => navigation.navigate(ROUTES.TENANT_REQUEST_DETAILS, { requestId: request._id })}
        >
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>{request.title}</Text>
            <View style={styles.cardActions}>
              <StatusBadge status={request.status} />
              {request.status === 'NEW' ? (
                <Pressable
                  style={styles.deleteButton}
                  onPress={(event) => {
                    event.stopPropagation?.()
                    promptDelete(request._id)
                  }}
                >
                  <Ionicons name='trash-outline' size={18} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
          </View>
          <Text style={styles.meta}>Date: {new Date(request.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.meta}>Property: {request.propertyName || '—'}</Text>
        </Pressable>
      ))}

      <Modal
        visible={isDeleteOpen}
        title='Delete request?'
        message='This action cannot be undone.'
        confirmText='Delete'
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedRequestId(null)
        }}
        onConfirm={handleDelete}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.headingL,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  cardActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  deleteButton: {
    width: 32,
    height: 32,
    marginRight: -spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.bodyL,
    color: colors.textPrimary,
    fontFamily: 'Inter_600SemiBold'
  },
  meta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Inter_500Medium'
  }
})
