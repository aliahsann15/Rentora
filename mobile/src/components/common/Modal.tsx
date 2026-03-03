import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../utils/theme'
import { Button } from './Button'

interface ModalProps {
  visible: boolean
  title: string
  message?: string
  confirmText?: string
  onClose: () => void
  onConfirm?: () => void
}

export const Modal = ({
  visible,
  title,
  message,
  confirmText = 'OK',
  onClose,
  onConfirm
}: ModalProps) => {
  return (
    <RNModal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <Pressable onPress={onClose}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            {onConfirm ? <Button title={confirmText} onPress={onConfirm} style={styles.confirmBtn} /> : null}
          </View>
        </View>
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm
  },
  title: {
    fontSize: typography.headingM,
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold'
  },
  message: {
    fontSize: typography.bodyM,
    color: colors.textSecondary,
    fontFamily: 'Inter_400Regular'
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md
  },
  cancel: {
    color: colors.textSecondary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_500Medium'
  },
  confirmBtn: {
    minWidth: 96,
    height: 40
  }
})
