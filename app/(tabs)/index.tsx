import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { KPICard } from '~/components/KPICard';
import { RadialFAB } from '~/components/RadialFAB';
import { mockJobs } from '~/data/mockData';

/* ---------------- SCREEN ---------------- */

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate] = useState(new Date());

  const dateStr = selectedDate.toISOString().split('T')[0];

  const selectedJobs = mockJobs.filter(
    (job) => job.scheduledDate === dateStr
  );

  const selectedRevenue = selectedJobs.reduce(
    (sum, job) => sum + job.total,
    0
  );

  const selectedSales = selectedJobs.reduce(
    (sum, job) => sum + job.total,
    0
  );

  const selectedPayments = selectedJobs.reduce((sum, job) => {
    const payments =
      job.payments?.filter(
        (p) => p.timestamp.split('T')[0] === dateStr
      ) || [];
    return sum + payments.reduce((s, p) => s + p.amount, 0);
  }, 0);

  const estimatesOnDate = mockJobs.filter(
    (job) => job.status === 'estimate' && job.scheduledDate === dateStr
  ).length;

  const jobsUndone = mockJobs.filter(
    (job) => job.status !== 'completed'
  ).length;

  return (
    <>
      <ScrollView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>

          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.dateText}>
              {selectedDate.toDateString()}
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* KPI GRID */}
          <View style={styles.kpiGrid}>
            <KPICard
              title="Jobs"
              value={selectedJobs.length}
              icon="briefcase-outline"
              trend={{ value: '+2 from yesterday', positive: true }}
              color="#E35838"
              bg="#FEF0E8"
            />

            <KPICard
              title="Revenue"
              value={`$${selectedRevenue.toFixed(0)}`}
              icon="cash-outline"
              trend={{ value: '+15% this week', positive: true }}
              color="#1A6D4C"
              bg="#E3F6EC"
            />

            <KPICard
              title="Sales"
              value={`$${selectedSales.toFixed(0)}`}
              icon="trending-up-outline"
              trend={{ value: '+8% from yesterday', positive: true }}
              color="#809FB4"
              bg="#EFF4F8"
            />

            <KPICard
              title="Payments"
              value={`$${selectedPayments.toFixed(0)}`}
              icon="card-outline"
              trend={{ value: '+12% this week', positive: true }}
              color="#35536B"
              bg="#E8F1F6"
            />

            <KPICard
              title="Estimates"
              value={estimatesOnDate}
              icon="document-text-outline"
              trend={{ value: '+3 this week', positive: true }}
              color="#E35838"
              bg="#FEF0E8"
            />

            <KPICard
              title="Jobs Undone"
              value={jobsUndone}
              icon="time-outline"
              trend={{ value: '-2 from yesterday', positive: false }}
              color="#809FB4"
              bg="#EFF4F8"
            />
          </View>

          {/* TO DO */}
          <View style={styles.todoSection}>
            <Text style={styles.todoTitle}>TO DO</Text>

            <TodoItem
              icon="alert-circle-outline"
              iconBg="#FEF0E8"
              iconColor="#E35838"
              title="Review changes requested"
              subtitle="3 quotes have changes requested"
              onPress={() => {
                console.log('TODO pressed');
              }}
            />

            <TodoItem
              icon="receipt-outline"
              iconBg="#FFF4EA"
              iconColor="#E35838"
              title="Follow up on past due invoices"
              subtitle="4 invoices are past due worth $15.5K"
              onPress={() => {
                console.log('TODO pressed');
              }}
            />

            <TodoItem
              icon="chatbubble-outline"
              iconBg="#F0F6FF"
              iconColor="#35536B"
              title="Review new requests"
              subtitle="2 new requests"
              onPress={() => {
                console.log('TODO pressed');
              }}
            />

            <TodoItem
              icon="construct-outline"
              iconBg="#E8F6EE"
              iconColor="#1A6D4C"
              title="Review jobs needing action"
              subtitle="3 jobs requiring action worth $950"
              onPress={() => {
                console.log('TODO pressed');
              }}
            />

            <TodoItem
              icon="calendar-outline"
              iconBg="#EFF4F8"
              iconColor="#35536B"
              title="Create a schedule"
              subtitle="See all your jobs at a glance"
              onPress={() => {
                console.log('TODO pressed');
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <RadialFAB />
    </>
  );
}

/* ---------------- COMPONENTS ---------------- */

function TodoItem({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.todoItem} onPress={onPress}>
      <View style={[styles.todoIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.todoItemTitle}>{title}</Text>
        <Text style={styles.todoItemSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#94A3B8"
      />
    </Pressable>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  todoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
  },
  todoTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 16,
    color: '#334155',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  todoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  todoItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
});