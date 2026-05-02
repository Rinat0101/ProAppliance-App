import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useAppTheme } from "~/components/theme/AppThemeContext";
import { DarkColors, LightColors, Spacing } from "~/styles";

import { JobDetailsDescription } from "../details/JobDetailsDescription";
import { JobDetailsInfoCard, type JobDetailValues } from "../details/JobDetailsInfoCard";
import { JobDetailsQuickActions } from "../details/JobDetailsQuickActions";
import { JobDetailsSchedule } from "../details/JobDetailsSchedule";
import { JobDetailsStatus } from "../details/JobDetailsStatus";
import { JobDetailsTags } from "../details/JobDetailsTags";
import { JobDetailsAttachmentsCard, type AttachedFile } from "../details/JobDetailsAttachmentsCard";

import { JobDetailsClientCard } from "../details/client/JobDetailsClientCard";
import { JobDetailsClientModal } from "../details/client/JobDetailsClientModal";

import type { Job, Client } from "~/types";
import type { JobClient } from "../details/client/types";

type Props = {
  job: Job;
  client?: Client;
};

function toJobClient(job: Job, client?: Client): JobClient {
  return {
    id: job.clientId,
    name: client?.name ?? job.clientName,
    phone: client?.phone ?? job.clientPhone,
    email: client?.email,
    address: client?.address ?? job.address,
    city: client?.city ?? job.city,
    state: client?.state ?? job.state,
    zip: client?.zip ?? job.zip,
    distanceMiles: job.distance ? parseFloat(job.distance) : undefined,
  };
}

function formatScheduleDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function JobDetailsTab({ job, client }: Props) {
  const { mode } = useAppTheme();
  const colors = mode === "dark" ? DarkColors : LightColors;

  const [description, setDescription] = useState(job.description);
  const [status, setStatus] = useState(job.status);
  const [tags, setTags] = useState<string[]>(job.tags);

  const [detailValues, setDetailValues] = useState<JobDetailValues>({
    job_type_id: job.title,
    description: job.description,
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientData, setClientData] = useState<JobClient>(() => toJobClient(job, client));

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
      >
        <View style={styles.stack}>
          {/* QUICK ACTIONS */}
          <JobDetailsQuickActions
            onStart={() => {}}
            onETA={() => {}}
            onPay={() => {}}
            onNote={() => {}}
            onAttachFiles={(files) =>
              setAttachedFiles((prev) => [
                ...prev,
                ...files.map((f) => ({ ...f, displayName: "Mobile upload", description: "", addedAt: Date.now() })),
              ])
            }
          />

          {/* DESCRIPTION */}
          <JobDetailsDescription value={description} onSave={setDescription} />

          {/* STATUS */}
          <JobDetailsStatus value={status} onChange={setStatus} />

          {/* CLIENT */}
          <JobDetailsClientCard
            client={clientData}
            onViewDetails={() => setClientModalOpen(true)}
          />

          {/* SCHEDULE */}
          <JobDetailsSchedule
            dateLabel={formatScheduleDate(job.scheduledDate)}
            startTime={job.scheduledTime}
            endTime={job.scheduledEndTime}
          />

          {/* DETAILS */}
          <JobDetailsInfoCard
            job={job}
            values={detailValues}
            onSave={setDetailValues}
          />

          {/* TAGS */}
          <JobDetailsTags value={tags} onChange={setTags} />

          {/* ATTACHMENTS */}
          <JobDetailsAttachmentsCard
            files={attachedFiles}
            onFilesChange={setAttachedFiles}
          />
        </View>
      </ScrollView>

      {/* CLIENT MODAL (view + edit + menu — all in one) */}
      <JobDetailsClientModal
        visible={clientModalOpen}
        client={clientData}
        onClose={() => setClientModalOpen(false)}
        onSave={(updated) => setClientData(updated)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  stack: {
    gap: Spacing.md,
  },
});
