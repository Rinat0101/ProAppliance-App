/**
 * JobDetailsInfoCard
 *
 * Shows the job type/title as a tappable card.
 * Tapping opens a full-screen "Edit details" modal with all job fields.
 *
 * API-READINESS:
 *  - Every field has an `odooKey` that maps to the Odoo field name.
 *  - `options` arrays are hardcoded for now — replace with API-fetched data later.
 *  - `values` state maps 1-to-1 to Odoo field names, ready for a POST/PUT payload.
 */

import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Radius, Spacing } from "~/styles";
import { ButtonBase, ButtonVariants } from "~/styles/buttons";
import type { Job } from "~/types";

/* ------------------------------------------------------------------ */
/*  Field config types                                                  */
/* ------------------------------------------------------------------ */

type FieldType = "text" | "textarea" | "select";

type FieldConfig = {
  odooKey: string;       // Odoo API field name — swap values with API data later
  label: string;
  type: FieldType;
  options?: string[];    // TODO: replace with API-fetched options per field
  multiline?: boolean;
};

type SectionConfig = {
  title: string;
  fields: FieldConfig[];
};

/* ------------------------------------------------------------------ */
/*  Field definitions                                                   */
/*  odooKey matches Odoo field names. Options are hardcoded for now.   */
/* ------------------------------------------------------------------ */

const SECTIONS: SectionConfig[] = [
  {
    title: "Job details",
    fields: [
      {
        odooKey: "job_type_id",
        label: "Job type",
        type: "select",
        // TODO: fetch from /api/job-types
        options: [
          "Refrigerator Repair", "Washer Repair", "Dryer Repair",
          "Dishwasher Repair", "Oven Repair", "Microwave Repair",
          "Freezer Repair", "Ice Maker Repair", "Range Repair",
        ],
      },
      {
        odooKey: "source_id",
        label: "Ad source",
        type: "select",
        // TODO: fetch from /api/sources
        options: [
          "Google My Business", "Yelp", "HomeAdvisor", "Thumbtack",
          "Angi", "Referral", "Repeat Customer", "Other",
        ],
      },
      {
        odooKey: "territory_id",
        label: "Service area",
        type: "select",
        // TODO: fetch from /api/territories
        options: [
          "GA-ATL-NE", "GA-ATL-NW", "GA-ATL-SE", "GA-ATL-SW",
          "FL-Miami", "FL-Orlando", "TX-Houston", "TX-Dallas",
          "CA-LA", "CA-SD", "NY-NYC",
        ],
      },
      {
        odooKey: "description",
        label: "Job description",
        type: "textarea",
      },
    ],
  },
  {
    title: "Extra Info",
    fields: [
      { odooKey: "max_discount", label: "Max Discount", type: "text" },
      { odooKey: "model_number", label: "Model Number", type: "text" },
      {
        odooKey: "estimator_id",
        label: "Estimator",
        type: "select",
        // TODO: fetch from /api/users?role=estimator
        options: ["Julia K", "Mike S", "Anna P", "Tom R"],
      },
      { odooKey: "reason_for_loss", label: "Reason For Loss", type: "textarea" },
      { odooKey: "reason_for_cancellation", label: "Reason For Cancelation", type: "textarea" },
    ],
  },
  {
    title: "Appliance Information",
    fields: [
      {
        odooKey: "company_id",
        label: "Service Company",
        type: "select",
        // TODO: fetch from /api/companies
        options: ["Pro Appliance Repair", "Other"],
      },
      {
        odooKey: "trade_id",
        label: "Trade",
        type: "select",
        // TODO: fetch from /api/trades
        options: [
          "Appliance Repair Low-End", "Appliance Repair High-End",
          "HVAC", "Plumbing", "Electrical",
        ],
      },
      {
        odooKey: "brand_id",
        label: "Brand",
        type: "select",
        // TODO: fetch from /api/brands
        options: [
          "GE", "Samsung", "LG", "Whirlpool", "Maytag", "Bosch",
          "KitchenAid", "Frigidaire", "Electrolux", "Sub-Zero", "Wolf",
        ],
      },
      { odooKey: "appliance_qty", label: "Appliances Quantity", type: "text" },
      { odooKey: "parts_description", label: "Parts Description", type: "text" },
      { odooKey: "tech_support_description", label: "Tech Support Description", type: "textarea" },
      { odooKey: "serial_number", label: "Serial Number", type: "text" },
      { odooKey: "warranty_until", label: "Warranty Untill", type: "text" },
      { odooKey: "parts_ordered", label: "Parts Ordered", type: "text" },
    ],
  },
  {
    title: "Property Information",
    fields: [
      {
        odooKey: "client_type",
        label: "Client Type",
        type: "select",
        options: ["Home Owner", "Renter", "Property Manager", "Business"],
      },
      {
        odooKey: "property_type",
        label: "Property Type",
        type: "select",
        options: ["Residential", "Commercial", "Industrial"],
      },
      {
        odooKey: "building_type",
        label: "Building Type",
        type: "select",
        options: ["House", "Apartment", "Condo", "Townhouse", "Office", "Warehouse"],
      },
    ],
  },
  {
    title: "Payer Information",
    fields: [
      {
        odooKey: "call_center_agent_id",
        label: "Call Center Agent",
        type: "select",
        // TODO: fetch from /api/users?role=call_center
        options: ["Julia K", "Mike S", "Anna P"],
      },
      {
        odooKey: "payer_id",
        label: "Payer",
        type: "select",
        options: ["Homeowner", "Insurance", "Warranty Company", "Property Manager"],
      },
      {
        odooKey: "desired_payment_type",
        label: "Desired Type Of Payment",
        type: "select",
        options: ["Cash", "Check", "Credit Card", "Zelle", "Venmo"],
      },
      {
        odooKey: "payment_status",
        label: "Payments Status",
        type: "select",
        options: ["Unpaid", "Partial", "Paid", "Refunded"],
      },
      { odooKey: "diagnostic_fee", label: "Diagnostic Fee", type: "text" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

// Values map: odooKey → string value
export type JobDetailValues = Record<string, string>;

type Props = {
  job: Job;
  values: JobDetailValues;
  onSave: (updated: JobDetailValues) => void;
};

/* ------------------------------------------------------------------ */
/*  Inline select picker sheet                                          */
/* ------------------------------------------------------------------ */

type SelectSheetProps = {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  colors: typeof LightColors;
};

function SelectSheet({ label, options, selected, onSelect, onClose, colors }: SelectSheetProps) {
  return (
    <View style={[sheetStyles.overlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[sheetStyles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[sheetStyles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[sheetStyles.sheetTitle, { color: colors.textPrimary }]}>{label}</Text>
        <ScrollView style={sheetStyles.optionsList} showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const isSelected = opt === selected;
            return (
              <Pressable
                key={opt}
                onPress={() => { onSelect(opt); onClose(); }}
                style={({ pressed }) => [
                  sheetStyles.optionRow,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryLight
                      : pressed ? colors.muted : "transparent",
                    borderColor: isSelected ? colors.primary : "transparent",
                  },
                ]}
              >
                <Text style={[sheetStyles.optionText, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                  {opt}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </Pressable>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 100,
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: "60%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  optionsList: {},
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function JobDetailsInfoCard({ job, values, onSave }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<JobDetailValues>(values);

  // Which select field picker is open: odooKey | null
  const [pickerField, setPickerField] = useState<FieldConfig | null>(null);

  function openModal() {
    setDraft({ ...values });
    setOpen(true);
  }

  function handleSave() {
    onSave(draft);
    setOpen(false);
  }

  function setField(key: string, val: string) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  // Displayed title in card: job type or job title fallback
  const displayTitle = values["job_type_id"] || job.title;

  return (
    <>
      {/* ── Card ── */}
      <Pressable
        onPress={openModal}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Details</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="build-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>
      </Pressable>

      {/* ── Full-screen edit modal ── */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (pickerField) { setPickerField(null); return; }
          setOpen(false);
        }}
      >
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.header }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.header }]}>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.headerBtn}>
              <Ionicons name="close" size={22} color={colors.primary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>Edit details</Text>
            <View style={styles.headerBtn} />
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              style={{ backgroundColor: colors.background }}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {SECTIONS.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    {section.title}
                  </Text>

                  {section.fields.map((field) => {
                    const val = draft[field.odooKey] ?? "";

                    if (field.type === "select") {
                      const hasValue = val.length > 0;
                      return (
                        <Pressable
                          key={field.odooKey}
                          onPress={() => setPickerField(field)}
                          style={[
                            styles.inputWrap,
                            { borderColor: colors.border, backgroundColor: colors.surface },
                          ]}
                        >
                          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                            {field.label}
                          </Text>
                          <View style={styles.selectRow}>
                            <Text
                              style={[
                                styles.selectValue,
                                { color: hasValue ? colors.textPrimary : colors.textSecondary },
                              ]}
                            >
                              {hasValue ? val : field.label}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                          </View>
                        </Pressable>
                      );
                    }

                    if (field.type === "textarea") {
                      return (
                        <View
                          key={field.odooKey}
                          style={[
                            styles.textareaWrap,
                            { borderColor: colors.border, backgroundColor: colors.surface },
                          ]}
                        >
                          <TextInput
                            value={val}
                            onChangeText={(t) => setField(field.odooKey, t)}
                            placeholder={field.label}
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            textAlignVertical="top"
                            style={[styles.textarea, { color: colors.textPrimary }]}
                          />
                        </View>
                      );
                    }

                    // text
                    return (
                      <View
                        key={field.odooKey}
                        style={[
                          styles.inputWrap,
                          { borderColor: colors.border, backgroundColor: colors.surface },
                        ]}
                      >
                        <TextInput
                          value={val}
                          onChangeText={(t) => setField(field.odooKey, t)}
                          placeholder={field.label}
                          placeholderTextColor={colors.textSecondary}
                          style={[styles.plainInput, { color: colors.textPrimary }]}
                        />
                      </View>
                    );
                  })}
                </View>
              ))}

              <View style={{ height: 100 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Save button */}
          <View style={[styles.saveBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSave}
              style={[ButtonBase, ButtonVariants.primary(colors), styles.saveBtn]}
            >
              <Text style={styles.saveBtnText}>Update job</Text>
            </Pressable>
          </View>

          {/* Inline select picker (rendered inside modal so it stacks correctly) */}
          {pickerField && (
            <SelectSheet
              label={pickerField.label}
              options={pickerField.options ?? []}
              selected={draft[pickerField.odooKey] ?? ""}
              onSelect={(v) => setField(pickerField.odooKey, v)}
              onClose={() => setPickerField(null)}
              colors={colors}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardSub: { fontSize: 14, flex: 1 },

  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBtn: { width: 32 },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    fontSize: 17,
    fontWeight: "700",
  },

  formContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: Spacing.sm,
  },

  // labeled input (select + text with floating label)
  inputWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    paddingBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    fontSize: 15,
    flex: 1,
  },
  plainInput: {
    fontSize: 15,
    padding: 0,
  },

  // textarea (no floating label — placeholder does the job)
  textareaWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 100,
  },
  textarea: {
    fontSize: 15,
    minHeight: 80,
  },

  saveBar: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 50,
    borderRadius: Radius.full,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
