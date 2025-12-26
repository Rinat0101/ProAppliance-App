// components/layout/AppSidebar.tsx
import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SidebarItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string; // we’ll enable later
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

const menuSections: SidebarSection[] = [
  {
    label: 'My Work',
    items: [
      { title: 'Home', icon: 'home-outline', route: '/' },
      { title: 'Schedule', icon: 'calendar-outline', route: '/schedule' },
      { title: 'Jobs', icon: 'briefcase-outline', route: '/jobs' },
      { title: 'Activities', icon: 'checkbox-outline', route: '/activities' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { title: 'Customers', icon: 'people-outline', route: '/customers' },
      { title: 'Contacts', icon: 'person-add-outline', route: '/contacts' },
    ],
  },
  {
    label: 'Assets',
    items: [
      { title: 'Equipment', icon: 'construct-outline', route: '/equipment' },
      { title: 'Inventory', icon: 'cube-outline', route: '/inventory' },
      { title: 'Tools', icon: 'location-outline', route: '/tools' },
    ],
  },
  {
    label: 'Time Reporting',
    items: [
      { title: 'Time Tracking', icon: 'time-outline', route: '/time-tracking' },
      { title: 'Reports', icon: 'document-text-outline', route: '/reports' },
    ],
  },
];

export function AppSidebar({
  visible,
  onClose,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void; // optional for now
}) {
  // TEMP user until auth is added
  const userEmail = 'mike.johnson@proappliance.com';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Overlay */}
      <Pressable style={styles.overlay} onPress={onClose} />

      {/* Drawer */}
      <SafeAreaView style={styles.drawer}>
        <View style={styles.drawerInner}>
          {/* Sections */}
          <View style={styles.content}>
            {menuSections.map((section) => (
              <View key={section.label} style={styles.section}>
                <Text style={styles.sectionLabel}>{section.label.toUpperCase()}</Text>

                {section.items.map((item) => (
                  <Pressable
                    key={item.title}
                    style={styles.item}
                    onPress={() => {
                      // For now: no navigation (you said no other pages yet)
                      // Later we’ll call onNavigate(item.route!)
                      if (item.route && onNavigate) onNavigate(item.route);
                      onClose();
                    }}
                  >
                    <View style={styles.itemLeft}>
                      <Ionicons name={item.icon} size={18} color="#0F172A" />
                      <Text style={styles.itemTitle}>{item.title}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.userRow}>
              <View style={styles.userBadge}>
                <Ionicons name="person-outline" size={16} color="#2563EB" />
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {userEmail}
              </Text>

              {/* Theme + Logout (stubs for now) */}
              <Pressable
                style={styles.iconBtn}
                onPress={() => {
                  // later: theme toggle
                  console.log('Toggle theme');
                }}
              >
                <Ionicons name="sunny-outline" size={18} color="#0F172A" />
              </Pressable>

              <Pressable
                style={styles.iconBtn}
                onPress={() => {
                  // later: sign out
                  console.log('Logout');
                }}
              >
                <Ionicons name="log-out-outline" size={18} color="#0F172A" />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '82%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
  },
  drawerInner: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userEmail: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});