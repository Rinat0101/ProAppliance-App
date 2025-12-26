import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Trend = {
  value: string;
  positive: boolean;
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: Trend;
  color?: string;
  bg?: string;
}

export function KPICard({
  title,
  value,
  icon,
  trend,
  color = '#0F172A',
  bg = '#F1F5F9',
}: KPICardProps) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, { color }]}>{value}</Text>
        </View>

        <Ionicons
          name={icon}
          size={20}
          color={color}
        />
      </View>

      {/* Trend */}
      {trend && (
        <View style={styles.trendRow}>
          <Text
            style={[
              styles.trendText,
              { color: trend.positive ? '#16A34A' : '#DC2626' },
            ]}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  card: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  trendRow: {
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});