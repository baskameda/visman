package eu.poc.claude.invitation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SecurityCheck {

    private Long          id;
    private Long          invitationId;
    private Long          visitorId;
    private String        status; // PENDING | APPROVED | REFUSED | BLACKLISTED
    private Integer       reliability;
    private String        securityNote;
    private String        securityReviewer;
    private String        assignedTo;      // officer assigned by round-robin at creation
    private String        clarificationQuestion;
    private String        clarificationAnswer;
    private Integer       clarificationCount;
    private LocalDateTime decidedAt;

    // ── Visitor detail (joined) ───────────────────────────────────────────────
    private String visitorFirstName;
    private String visitorLastName;
    private String visitorCompany;
    private String visitorFunction;
    private String visitorEmail;
    private String visitorPhone;

    // ── Invitation detail (joined) ────────────────────────────────────────────
    private LocalDate startDate;
    private LocalDate endDate;
    private Long      entranceId;
    private String    entranceName;
    private String    inviterUsername;
    private String    invitationCompany;
    private String    invitationDescription;

    // ── Accessors ─────────────────────────────────────────────────────────────

    public Long          getId()                      { return id; }
    public void          setId(Long v)                { this.id = v; }
    public Long          getInvitationId()            { return invitationId; }
    public void          setInvitationId(Long v)      { this.invitationId = v; }
    public Long          getVisitorId()               { return visitorId; }
    public void          setVisitorId(Long v)         { this.visitorId = v; }
    public String        getStatus()                  { return status; }
    public void          setStatus(String v)          { this.status = v; }
    public Integer       getReliability()             { return reliability; }
    public void          setReliability(Integer v)    { this.reliability = v; }
    public String        getSecurityNote()            { return securityNote; }
    public void          setSecurityNote(String v)    { this.securityNote = v; }
    public String        getSecurityReviewer()        { return securityReviewer; }
    public void          setSecurityReviewer(String v){ this.securityReviewer = v; }
    public String        getAssignedTo()              { return assignedTo; }
    public void          setAssignedTo(String v)      { this.assignedTo = v; }
    public String        getClarificationQuestion()   { return clarificationQuestion; }
    public void          setClarificationQuestion(String v) { this.clarificationQuestion = v; }
    public String        getClarificationAnswer()     { return clarificationAnswer; }
    public void          setClarificationAnswer(String v)   { this.clarificationAnswer = v; }
    public Integer       getClarificationCount()      { return clarificationCount; }
    public void          setClarificationCount(Integer v)   { this.clarificationCount = v; }
    public LocalDateTime getDecidedAt()               { return decidedAt; }
    public void          setDecidedAt(LocalDateTime v){ this.decidedAt = v; }

    public String  getVisitorFirstName()              { return visitorFirstName; }
    public void    setVisitorFirstName(String v)      { this.visitorFirstName = v; }
    public String  getVisitorLastName()               { return visitorLastName; }
    public void    setVisitorLastName(String v)       { this.visitorLastName = v; }
    public String  getVisitorCompany()                { return visitorCompany; }
    public void    setVisitorCompany(String v)        { this.visitorCompany = v; }
    public String  getVisitorFunction()               { return visitorFunction; }
    public void    setVisitorFunction(String v)       { this.visitorFunction = v; }
    public String  getVisitorEmail()                  { return visitorEmail; }
    public void    setVisitorEmail(String v)          { this.visitorEmail = v; }
    public String  getVisitorPhone()                  { return visitorPhone; }
    public void    setVisitorPhone(String v)          { this.visitorPhone = v; }

    public LocalDate getStartDate()                   { return startDate; }
    public void      setStartDate(LocalDate v)        { this.startDate = v; }
    public LocalDate getEndDate()                     { return endDate; }
    public void      setEndDate(LocalDate v)          { this.endDate = v; }
    public Long      getEntranceId()                  { return entranceId; }
    public void      setEntranceId(Long v)            { this.entranceId = v; }
    public String    getEntranceName()                { return entranceName; }
    public void      setEntranceName(String v)        { this.entranceName = v; }
    public String    getInviterUsername()             { return inviterUsername; }
    public void      setInviterUsername(String v)     { this.inviterUsername = v; }
    public String    getInvitationCompany()           { return invitationCompany; }
    public void      setInvitationCompany(String v)   { this.invitationCompany = v; }
    public String    getInvitationDescription()       { return invitationDescription; }
    public void      setInvitationDescription(String v) { this.invitationDescription = v; }
}
