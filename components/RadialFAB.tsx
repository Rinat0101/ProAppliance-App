import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/* ---------------- CONFIG ---------------- */

const FAB_SIZE = 56;
const ACTION_SIZE = 48;

const FAB_BOTTOM = 84;
const FAB_RIGHT = 18;

const ACTIONS = [
  { icon: 'briefcase-outline', label: 'Job', path: '/jobs/new', x: 0, y: -76 },
  { icon: 'document-text-outline', label: 'Estimate', path: '/estimates/new', x: -54, y: -54 },
  { icon: 'receipt-outline', label: 'Invoice', path: '/invoices/new', x: -76, y: 0 },
] as const;

/* ---------------- COMPONENT ---------------- */

export function RadialFAB() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const animation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(animation, {
      toValue: open ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    setOpen(!open);
  };

  const handleAction = (path: string) => {
    toggle();
    router.push(path);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <Pressable
          style={styles.overlay}
          onPress={toggle}
        />
      )}

      {/* Action buttons */}
      {ACTIONS.map((action, index) => {
        const translateX = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, action.x],
        });

        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, action.y],
        });

        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });

        const opacity = animation;

        return (
          <Animated.View
            key={action.label}
            style={[
              styles.actionWrapper,
              {
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
                bottom: FAB_BOTTOM,
                right: FAB_RIGHT,
              },
            ]}
          >
            <Pressable
              style={styles.actionButton}
              onPress={() => handleAction(action.path)}
            >
              <Ionicons
                name={action.icon}
                size={18}
                color="white"
              />
              <Text style={styles.actionLabel}>
                {action.label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <Pressable
        style={[
          styles.fab,
          {
            bottom: FAB_BOTTOM,
            right: FAB_RIGHT,
          },
        ]}
        onPress={toggle}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              },
            ],
          }}
        >
          <Ionicons
            name={open ? 'close' : 'add'}
            size={26}
            color="white"
          />
        </Animated.View>
      </Pressable>
    </>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 40,
  },

  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    elevation: 6,
  },

  actionWrapper: {
    position: 'absolute',
    zIndex: 50,
  },

  actionButton: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  actionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
    marginTop: 2,
  },
});