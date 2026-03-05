package eu.poc.claude.delegate;

import org.operaton.bpm.engine.delegate.DelegateTask;
import org.operaton.bpm.engine.delegate.TaskListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Task listener attached to both the Security Check and Clarification user tasks
 * in VisitProcess_2.0.
 *
 * On CREATE:
 *   1. Sets "securityCheckId" as a task-level variable so the frontend can resolve
 *      the DB record from the Operaton task ID.
 *   2. Re-assigns the task to securityReviewer when looping back after clarification
 *      (mirrors the old SecurityTaskAssignmentListener behaviour).
 */
@Component("securityCheckTaskListener")
public class SecurityCheckTaskListener implements TaskListener {

    private static final Logger log = LoggerFactory.getLogger(SecurityCheckTaskListener.class);

    @Override
    public void notify(DelegateTask task) {
        // Expose securityCheckId as a task-local variable for the frontend
        Object scId = task.getExecution().getVariable("currentSecurityCheckId");
        if (scId != null) {
            task.setVariableLocal("securityCheckId", scId);
            log.debug("[TaskListener] task={} securityCheckId={}", task.getId(), scId);
        }

        // Re-assign Security Check to the original reviewer on loop-back
        if ("Activity_SecurityCheck_V2".equals(task.getTaskDefinitionKey())) {
            Object reviewer = task.getExecution().getVariable("securityReviewer");
            if (reviewer instanceof String r && !r.isBlank()) {
                task.setAssignee(r);
                log.info("[TaskListener] Security Check {} re-assigned to '{}'", task.getId(), r);
            }
        }
    }
}
