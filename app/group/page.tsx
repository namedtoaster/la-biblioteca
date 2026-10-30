'use client';

import { useState } from 'react';
import { GroupCard } from '@/components/GroupCard';
import { JoinGroup } from '@/components/JoinGroup';
import { leaveGroup } from '@/lib/groups';
import { useGroup } from '@/lib/useGroup';

export default function GroupPage() {
  const { group, refresh, error } = useGroup();
  const [busy, setBusy] = useState(false);

  if (group === undefined) return <p className="muted">Loading your group...</p>;

  return (
    <div className="stack">
      <h1 className="title">Grupo</h1>
      {error && <p className="warn" role="alert">{error}</p>}
      {group ? (
        <>
          <GroupCard />
          <p className="muted small">
            Everyone answers the same question each day. Only your group can hear your answers. When the 2 weeks end, you can join a new group.
          </p>
          {/* "Leave challenge" at the bottom of the challenge page: Tempo (Mobbin). */}
          <button
            className="button secondary"
            disabled={busy}
            onClick={async () => {
              if (!confirm('Leave this group? You can join a new one any time.')) return;
              setBusy(true);
              await leaveGroup();
              await refresh();
              setBusy(false);
            }}
          >
            Leave group
          </button>
        </>
      ) : (
        <JoinGroup />
      )}
    </div>
  );
}
