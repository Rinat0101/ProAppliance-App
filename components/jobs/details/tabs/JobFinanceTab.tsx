import React from "react";
import { View, StyleSheet } from "react-native";
import { Spacing } from "~/styles";
import { CustomerCard } from "../finance/CustomerCard";
import type { Job, Client } from "~/types";

type Props = {
  job: Job;
  client?: Client;
};

export const JobFinanceTab = ({ job, client }: Props) => {
  return (
    <View style={styles.container}>
      <CustomerCard
        customerName={client?.name ?? job.clientName}
        total={job.total}
        balance={job.balance}
        hasInvoice={!!job.invoiceNumber}
        onInvoicePress={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
});
