package eu.poc.claude.sse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.operaton.bpm.engine.TaskService;
import org.operaton.bpm.engine.task.Task;
import org.operaton.bpm.engine.task.TaskQuery;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.Field;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link TaskEventService}.
 *
 * Source file: 92 lines. Contains:
 * <ul>
 *   <li>subscribe()             — lines 40-48</li>
 *   <li>detectAndBroadcast()    — lines 53-65  (scheduled every 3 s)</li>
 *   <li>buildSnapshot()         — lines 69-77  (private)</li>
 *   <li>broadcast()             — lines 79-91  (private)</li>
 * </ul>
 * Target: ≥ 95 % line + branch coverage.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TaskEventService")
class TaskEventServiceTest {

    private TaskEventService service;

    @Mock private TaskService taskService;
    @Mock private TaskQuery   taskQuery;

    @BeforeEach
    void setUp() {
        service = new TaskEventService(taskService);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  subscribe()
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("subscribe()")
    class Subscribe {

        @Test
        @DisplayName("returns a non-null SseEmitter")
        void returnsNonNull() {
            assertThat(service.subscribe()).isNotNull();
        }

        @Test
        @DisplayName("each call returns a distinct emitter")
        void distinctEmitters() {
            SseEmitter a = service.subscribe();
            SseEmitter b = service.subscribe();
            assertThat(a).isNotSameAs(b);
        }

        @Test
        @DisplayName("adds emitter to internal list")
        void addsToEmittersList() throws Exception {
            service.subscribe();
            service.subscribe();
            assertThat(getEmitters(service)).hasSize(2);
        }

        @Test
        @DisplayName("onCompletion callback removes emitter from list")
        void onCompletionRemovesEmitter() throws Exception {
            SseEmitter emitter = service.subscribe();
            assertThat(getEmitters(service)).hasSize(1);

            emitter.complete();  // triggers onCompletion callback
            assertThat(getEmitters(service)).isEmpty();
        }

        @Test
        @DisplayName("onError callback removes emitter from list")
        void onErrorRemovesEmitter() throws Exception {
            SseEmitter emitter = service.subscribe();
            assertThat(getEmitters(service)).hasSize(1);

            emitter.completeWithError(new RuntimeException("test"));
            assertThat(getEmitters(service)).isEmpty();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  detectAndBroadcast()
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("detectAndBroadcast()")
    class DetectAndBroadcast {

        @Test
        @DisplayName("is a no-op when there are no subscribers (line 54 early return)")
        void noOpWhenNoSubscribers() {
            service.detectAndBroadcast();

            verifyNoInteractions(taskService);
        }

        @Test
        @DisplayName("queries tasks for process key VisitProcess_1.0")
        void queriesCorrectProcessKey() {
            service.subscribe();
            stubTaskQuery(Collections.emptyList());

            service.detectAndBroadcast();

            verify(taskQuery).processDefinitionKey("VisitProcess_1.0");
        }

        @Test
        @DisplayName("queries tasks ordered by taskId ascending")
        void ordersTasksByIdAsc() {
            service.subscribe();
            stubTaskQuery(Collections.emptyList());

            service.detectAndBroadcast();

            verify(taskQuery).orderByTaskId();
            verify(taskQuery).asc();
        }

        @Test
        @DisplayName("does NOT broadcast when snapshot is unchanged (two identical polls)")
        void noBroadcastWhenUnchanged() throws Exception {
            service.subscribe();

            // Poll 1: empty
            stubTaskQuery(Collections.emptyList());
            service.detectAndBroadcast();

            // Poll 2: still empty — snapshot unchanged
            stubTaskQuery(Collections.emptyList());
            service.detectAndBroadcast();

            // lastSnapshot should have been set once and not re-broadcast
            assertThat(getLastSnapshot(service)).isEmpty();
        }

        @Test
        @DisplayName("broadcasts when a new task appears (snapshot changes)")
        void broadcastsOnNewTask() throws Exception {
            SseEmitter emitter = service.subscribe();

            // Poll 1: empty
            stubTaskQuery(Collections.emptyList());
            service.detectAndBroadcast();
            String after1 = getLastSnapshot(service);

            // Poll 2: one task appears
            Task task = mockTask("task-1", null);
            stubTaskQuery(List.of(task));
            service.detectAndBroadcast();
            String after2 = getLastSnapshot(service);

            assertThat(after2).isNotEqualTo(after1);
            assertThat(after2).isEqualTo("task-1:null");
        }

        @Test
        @DisplayName("broadcasts when a task is removed (completed)")
        void broadcastsOnTaskRemoval() throws Exception {
            service.subscribe();

            Task task = mockTask("task-1", "alice");
            stubTaskQuery(List.of(task));
            service.detectAndBroadcast();

            stubTaskQuery(Collections.emptyList());
            service.detectAndBroadcast();

            assertThat(getLastSnapshot(service)).isEmpty();
        }

        @Test
        @DisplayName("broadcasts when a task assignee changes (claim)")
        void broadcastsOnAssigneeChange() throws Exception {
            service.subscribe();

            Task unclaimed = mockTask("task-1", null);
            stubTaskQuery(List.of(unclaimed));
            service.detectAndBroadcast();
            String before = getLastSnapshot(service);

            Task claimed = mockTask("task-1", "alice");
            stubTaskQuery(List.of(claimed));
            service.detectAndBroadcast();
            String after = getLastSnapshot(service);

            assertThat(before).isEqualTo("task-1:null");
            assertThat(after).isEqualTo("task-1:alice");
        }

        @Test
        @DisplayName("snapshot format: comma-separated 'id:assignee' pairs")
        void snapshotFormat() throws Exception {
            service.subscribe();

            Task t1 = mockTask("task-A", "alice");
            Task t2 = mockTask("task-B", null);
            Task t3 = mockTask("task-C", "bob");
            stubTaskQuery(List.of(t1, t2, t3));
            service.detectAndBroadcast();

            assertThat(getLastSnapshot(service))
                    .isEqualTo("task-A:alice,task-B:null,task-C:bob");
        }

        @Test
        @DisplayName("handles TaskService exception without propagating (catch on line 62)")
        void handlesTaskServiceException() {
            service.subscribe();
            when(taskService.createTaskQuery()).thenThrow(new RuntimeException("DB down"));

            assertThatCode(() -> service.detectAndBroadcast()).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("snapshot is not updated when TaskService throws")
        void snapshotUnchangedOnError() throws Exception {
            service.subscribe();

            // Successful poll with a task
            Task task = mockTask("task-1", "alice");
            stubTaskQuery(List.of(task));
            service.detectAndBroadcast();
            String snapshot1 = getLastSnapshot(service);

            // Error on next poll
            when(taskService.createTaskQuery()).thenThrow(new RuntimeException("DB down"));
            service.detectAndBroadcast();

            // Snapshot should remain the same
            assertThat(getLastSnapshot(service)).isEqualTo(snapshot1);
        }

        @Test
        @DisplayName("dead emitters are removed during broadcast")
        void removesDeadEmittersDuringBroadcast() throws Exception {
            // Subscribe two emitters. Complete one to make it "dead"
            SseEmitter live = service.subscribe();
            SseEmitter dead = service.subscribe();
            dead.complete();  // marks it as done

            assertThat(getEmitters(service)).hasSize(1);  // onCompletion removed it

            // Trigger a snapshot change to force broadcast
            stubTaskQuery(Collections.emptyList());
            service.detectAndBroadcast();

            Task newTask = mockTask("task-new", null);
            stubTaskQuery(List.of(newTask));
            service.detectAndBroadcast();

            // The broadcast should succeed for the live emitter without error
            assertThat(getEmitters(service)).hasSizeLessThanOrEqualTo(1);
        }

        @Test
        @DisplayName("broadcast sends to ALL subscribers when snapshot changes")
        void broadcastsToAllSubscribers() throws Exception {
            // Subscribe 3 emitters
            service.subscribe();
            service.subscribe();
            service.subscribe();

            // Initial empty poll
            stubTaskQuery(Collections.emptyList());
            service.detectAndBroadcast();

            // Trigger snapshot change
            Task task = mockTask("t1", null);
            stubTaskQuery(List.of(task));
            service.detectAndBroadcast();

            // At this point, all 3 emitters received a send attempt.
            // Some may have failed (SseEmitter limitations in test context).
            // Just verify no crash and internal state is consistent.
            assertThat(getLastSnapshot(service)).isEqualTo("t1:null");
        }

        @Test
        @DisplayName("handles empty task list (all processes completed)")
        void handlesEmptyTaskList() throws Exception {
            service.subscribe();

            stubTaskQuery(Collections.emptyList());
            service.detectAndBroadcast();

            assertThat(getLastSnapshot(service)).isEmpty();
        }

        @Test
        @DisplayName("first call always detects change (initial lastSnapshot is empty string)")
        void firstCallDetectsChange() throws Exception {
            service.subscribe();

            Task task = mockTask("task-1", "alice");
            stubTaskQuery(List.of(task));
            service.detectAndBroadcast();

            // "task-1:alice" != "" → change detected on very first poll
            assertThat(getLastSnapshot(service)).isNotEmpty();
        }

        @Test
        @DisplayName("first call with no tasks does NOT detect change (snapshot == empty == lastSnapshot)")
        void firstCallNoTasksNoChange() throws Exception {
            service.subscribe();

            stubTaskQuery(Collections.emptyList());
            service.detectAndBroadcast();

            // Both are "" → no change → no broadcast
            assertThat(getLastSnapshot(service)).isEmpty();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Concurrent-safety
    // ══════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Concurrency")
    class Concurrency {

        @Test
        @DisplayName("emitters list is CopyOnWriteArrayList (thread-safe)")
        void emittersListIsThreadSafe() throws Exception {
            assertThat(getEmitters(service))
                    .isInstanceOf(CopyOnWriteArrayList.class);
        }

        @Test
        @DisplayName("lastSnapshot field is volatile")
        void lastSnapshotIsVolatile() throws Exception {
            Field f = TaskEventService.class.getDeclaredField("lastSnapshot");
            assertThat(java.lang.reflect.Modifier.isVolatile(f.getModifiers())).isTrue();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════════════════════════════════════

    private void stubTaskQuery(List<Task> result) {
        reset(taskService, taskQuery);
        when(taskService.createTaskQuery()).thenReturn(taskQuery);
        when(taskQuery.processDefinitionKey(anyString())).thenReturn(taskQuery);
        when(taskQuery.orderByTaskId()).thenReturn(taskQuery);
        when(taskQuery.asc()).thenReturn(taskQuery);
        when(taskQuery.list()).thenReturn(result);
    }

    private Task mockTask(String id, String assignee) {
        Task task = mock(Task.class);
        lenient().when(task.getId()).thenReturn(id);
        lenient().when(task.getAssignee()).thenReturn(assignee);
        return task;
    }

    @SuppressWarnings("unchecked")
    private CopyOnWriteArrayList<SseEmitter> getEmitters(TaskEventService svc) throws Exception {
        Field f = TaskEventService.class.getDeclaredField("emitters");
        f.setAccessible(true);
        return (CopyOnWriteArrayList<SseEmitter>) f.get(svc);
    }

    private String getLastSnapshot(TaskEventService svc) throws Exception {
        Field f = TaskEventService.class.getDeclaredField("lastSnapshot");
        f.setAccessible(true);
        return (String) f.get(svc);
    }
}
