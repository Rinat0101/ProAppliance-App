import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '~/contexts/AuthContext';
import { useAppTheme } from '~/components/theme/AppThemeContext';
import { LightColors, DarkColors } from '~/styles';

export default function LoginScreen() {
  const { login } = useAuth();
  const { mode } = useAppTheme();
  const colors = mode === 'dark' ? DarkColors : LightColors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      // _layout.tsx handles redirect based on role
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Login error]', msg);
      setError(msg || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo / title */}
        <View style={styles.header}>
          <View style={[styles.logoMark, { backgroundColor: colors.primary }]} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Pro Appliance
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to your account
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Password
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
          </View>

          {error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          )}

          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 40,
  },

  header: {
    alignItems: 'center',
    gap: 8,
  },

  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 8,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },

  form: {
    gap: 16,
  },

  field: {
    gap: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
