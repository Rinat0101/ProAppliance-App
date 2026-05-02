'use client';

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from "~/components/theme/AppThemeContext";
import { Card as CardStyle } from '~/styles/cards';

type Props = {
  customerName: string;
  total: number;
  balance: number;
  hasInvoice: boolean;
  onInvoicePress: () => void;
};

export const CustomerCard = ({
  customerName,
  total,
  balance,
  hasInvoice,
  onInvoicePress,
}: Props) => {
  const { colors } = useAppTheme();

  return (
    <View style={[CardStyle(colors), styles.card]}>
      <View style={styles.row}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.valueBold}>{customerName}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.value}>${(total ?? 0).toFixed(2)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Balance</Text>
        <Text style={styles.value}>${(balance ?? 0).toFixed(2)}</Text>
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onInvoicePress}
      >
        <Text style={styles.buttonText}>
          {hasInvoice ? 'View invoice' : 'Create invoice'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  row: {
    marginBottom: 8,
  },
  label: {
    color: '#6B7280', // Tailwind gray-500
    fontSize: 14,
  },
  valueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827', // Tailwind gray-900
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});