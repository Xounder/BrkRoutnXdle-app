import { CreateActionModal } from "../../features/shared/CreateActionModal";
import { TaskModal } from "../../features/tasks/TaskModal";
import { BlockModal } from "../../features/blocks/BlockModal";
import { SettingsModal } from "../../components/SettingsModal";
import { DeleteEventDialog } from "../../features/preview/DeleteEventDialog";
import { ConflictDialog } from "../../features/completion/ConflictDialog";
import { TokenRetryModal } from "../../features/completion/TokenRetryModal";
import type { DashboardModalsProps } from "./dashboardTypes";

/**
 * Renders every dashboard modal in a fixed order. Adds NO state and NO copy —
 * all state lives in `useDashboardModals`, all props come from `DashboardPage`.
 *
 * Order: CreateActionModal, BlockModal (create-prefill), TaskModal (edit),
 * BlockModal (edit), SettingsModal, DeleteEventDialog, ConflictDialog,
 * TokenRetryModal.
 */
export function DashboardModals({
  modals,
  editing,
  conflictState,
  onCreateBlockFromSlot,
  onCreateTaskInline,
  onCalendarRetry,
  onReload,
  onDiscardPreview,
}: DashboardModalsProps) {
  return (
    <>
      {/* CreateActionModal: appears when an empty calendar slot is selected */}
      {modals.selectedSlot && (
        <CreateActionModal
          start={modals.selectedSlot.start}
          end={modals.selectedSlot.end}
          onCreateBlock={onCreateBlockFromSlot}
          onCreateTaskInline={onCreateTaskInline}
          onClose={() => modals.setSelectedSlot(null)}
        />
      )}

      {/* BlockModal: creating a block from a slot click */}
      {modals.creatingBlockPrefill !== null && (
        <BlockModal
          block={null}
          defaultStartDate={modals.creatingBlockPrefill.startDate}
          defaultEndDate={modals.creatingBlockPrefill.endDate}
          defaultStartTime={modals.creatingBlockPrefill.startTime}
          defaultEndTime={modals.creatingBlockPrefill.endTime}
          onClose={() => modals.setCreatingBlockPrefill(null)}
        />
      )}

      {/* TaskModal: editing an existing task */}
      {modals.editingTask && (
        <TaskModal
          task={modals.editingTask}
          onClose={() => modals.setEditingTask(null)}
        />
      )}

      {/* BlockModal: editing an existing block */}
      {modals.editingBlock && (
        <BlockModal
          block={modals.editingBlock}
          onClose={() => modals.setEditingBlock(null)}
        />
      )}

      <SettingsModal isOpen={modals.settingsOpen} onClose={modals.closeSettings} />

      <DeleteEventDialog
        isOpen={editing.deleteTarget !== null}
        eventTitle={editing.deleteTarget?.title ?? ""}
        onConfirm={editing.confirmDelete}
        onCancel={editing.cancelDelete}
      />

      <ConflictDialog
        isOpen={conflictState.hasConflicts}
        changedEventCount={conflictState.changedEvents.length}
        onReload={onReload}
        onDiscardPreview={onDiscardPreview}
      />

      <TokenRetryModal
        isOpen={modals.tokenModalOpen}
        onClose={() => modals.setTokenModalOpen(false)}
        onRetry={onCalendarRetry}
      />
    </>
  );
}
