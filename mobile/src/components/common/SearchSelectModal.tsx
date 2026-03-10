import { useEffect, useMemo, useState } from 'react'
import { FlatList, Modal as RNModal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../utils/theme'

type SearchSelectModalProps = {
  visible: boolean
  title: string
  items: string[]
  selectedValue?: string
  filterQuery?: string
  showSearch?: boolean
  searchPlaceholder?: string
  emptyText?: string
  maxHeight?: number | string
  listMaxHeight?: number
  onClose: () => void
  onSelect: (value: string) => void
}

export const SearchSelectModal = ({
  visible,
  title,
  items,
  selectedValue,
  filterQuery,
  showSearch = true,
  searchPlaceholder = 'Search',
  emptyText = 'No results',
  maxHeight = '60%',
  listMaxHeight = 320,
  onClose,
  onSelect
}: SearchSelectModalProps) => {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!visible) {
      setQuery('')
    }
  }, [visible])

  const filteredItems = useMemo(() => {
    const sourceQuery = showSearch ? query : filterQuery || ''
    const normalized = sourceQuery.trim().toLowerCase()
    if (!normalized) {
      return items
    }

    return items.filter((item) => item.toLowerCase().includes(normalized))
  }, [items, query])

  return (
    <RNModal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { maxHeight }]} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          {showSearch ? (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
          ) : null}
          <View style={[styles.listWrap, { maxHeight: listMaxHeight }]}>
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps='handled'
              renderItem={({ item }) => {
                const isSelected = item === selectedValue
                return (
                  <Pressable
                    style={[styles.itemRow, isSelected && styles.itemRowActive]}
                    onPress={() => {
                      onSelect(item)
                      onClose()
                    }}
                  >
                    <Text style={[styles.itemText, isSelected && styles.itemTextActive]}>{item}</Text>
                  </Pressable>
                )
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
            />
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontFamily: 'Inter_400Regular'
  },
  listWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden'
  },
  itemRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface
  },
  itemRowActive: {
    backgroundColor: colors.primarySoft
  },
  itemText: {
    color: colors.textPrimary,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_400Regular'
  },
  itemTextActive: {
    color: colors.primary,
    fontFamily: 'Inter_500Medium'
  },
  emptyText: {
    padding: spacing.md,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.bodyM,
    fontFamily: 'Inter_400Regular'
  }
})
