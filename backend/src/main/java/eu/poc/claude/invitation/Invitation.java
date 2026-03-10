package eu.poc.claude.invitation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class Invitation {

    private Long          id;
    private String        inviterUsername;
    private LocalDate     startDate;
    private LocalDate     endDate;
    private Long          entranceId;
    private String        entranceName;
    private String        company;
    private String        description;
    private String        processInstanceId;
    private LocalDateTime createdAt;

    /** Computed from security-check rows – not stored as a column. */
    private String        status;

    /** Populated by GET /api/invitations/{id} (drill-down). */
    private List<InvitationVisitorDetail> visitors;

    // ── Accessors ─────────────────────────────────────────────────────────────

    public Long          getId()                            { return id; }
    public void          setId(Long id)                    { this.id = id; }

    public String        getInviterUsername()               { return inviterUsername; }
    public void          setInviterUsername(String v)      { this.inviterUsername = v; }

    public LocalDate     getStartDate()                     { return startDate; }
    public void          setStartDate(LocalDate v)         { this.startDate = v; }

    public LocalDate     getEndDate()                       { return endDate; }
    public void          setEndDate(LocalDate v)           { this.endDate = v; }

    public Long          getEntranceId()                    { return entranceId; }
    public void          setEntranceId(Long v)             { this.entranceId = v; }

    public String        getEntranceName()                  { return entranceName; }
    public void          setEntranceName(String v)         { this.entranceName = v; }

    public String        getCompany()                       { return company; }
    public void          setCompany(String v)              { this.company = v; }

    public String        getDescription()                   { return description; }
    public void          setDescription(String v)          { this.description = v; }

    public String        getProcessInstanceId()             { return processInstanceId; }
    public void          setProcessInstanceId(String v)    { this.processInstanceId = v; }

    public LocalDateTime getCreatedAt()                     { return createdAt; }
    public void          setCreatedAt(LocalDateTime v)     { this.createdAt = v; }

    public String        getStatus()                        { return status; }
    public void          setStatus(String v)               { this.status = v; }

    public List<InvitationVisitorDetail> getVisitors()     { return visitors; }
    public void setVisitors(List<InvitationVisitorDetail> v) { this.visitors = v; }

    // ── Nested DTO for drill-down ─────────────────────────────────────────────

    public static class InvitationVisitorDetail {
        private Long         visitorId;
        private String       firstName;
        private String       lastName;
        private String       company;
        private Long         securityCheckId;
        private String       securityCheckStatus;
        private Integer      reliability;
        private List<VisitSummary> visits;
        private String       assignedTo;
        private String       securityReviewer;
        private Integer      clarificationCount;
        private String       clarificationQuestion;

        public Long    getVisitorId()             { return visitorId; }
        public void    setVisitorId(Long v)       { this.visitorId = v; }
        public String  getFirstName()             { return firstName; }
        public void    setFirstName(String v)     { this.firstName = v; }
        public String  getLastName()              { return lastName; }
        public void    setLastName(String v)      { this.lastName = v; }
        public String  getCompany()               { return company; }
        public void    setCompany(String v)       { this.company = v; }
        public Long    getSecurityCheckId()       { return securityCheckId; }
        public void    setSecurityCheckId(Long v) { this.securityCheckId = v; }
        public String  getSecurityCheckStatus()   { return securityCheckStatus; }
        public void    setSecurityCheckStatus(String v) { this.securityCheckStatus = v; }
        public Integer getReliability()           { return reliability; }
        public void    setReliability(Integer v)  { this.reliability = v; }
        public List<VisitSummary> getVisits()     { return visits; }
        public void    setVisits(List<VisitSummary> v) { this.visits = v; }
        public String  getAssignedTo()            { return assignedTo; }
        public void    setAssignedTo(String v)    { this.assignedTo = v; }
        public String  getSecurityReviewer()      { return securityReviewer; }
        public void    setSecurityReviewer(String v) { this.securityReviewer = v; }
        public Integer getClarificationCount()    { return clarificationCount; }
        public void    setClarificationCount(Integer v) { this.clarificationCount = v; }
        public String  getClarificationQuestion() { return clarificationQuestion; }
        public void    setClarificationQuestion(String v) { this.clarificationQuestion = v; }
    }

    public static class VisitSummary {
        private Long      id;
        private String    visitDate;
        private String    status;

        public Long   getId()           { return id; }
        public void   setId(Long v)     { this.id = v; }
        public String getVisitDate()    { return visitDate; }
        public void   setVisitDate(String v) { this.visitDate = v; }
        public String getStatus()       { return status; }
        public void   setStatus(String v)    { this.status = v; }
    }
}
