package eu.poc.claude.invitation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class Visit {

    private Long          id;
    private Long          securityCheckId;
    private Long          visitorId;
    private Long          invitationId;
    private LocalDate     visitDate;
    private Long          entranceId;
    private String        entranceName;
    private String        status; // PENDING | CHECKED_IN | NO_SHOW
    private LocalDateTime checkedInAt;
    private String        checkedInBy;

    // ── Visitor detail (joined) ───────────────────────────────────────────────
    private String visitorFirstName;
    private String visitorLastName;
    private String visitorCompany;
    private String visitorFunction;

    // ── Invitation detail (joined) ────────────────────────────────────────────
    private LocalDate invitationStartDate;
    private LocalDate invitationEndDate;
    private String    inviterUsername;

    // ── Accessors ─────────────────────────────────────────────────────────────

    public Long          getId()                        { return id; }
    public void          setId(Long v)                  { this.id = v; }
    public Long          getSecurityCheckId()           { return securityCheckId; }
    public void          setSecurityCheckId(Long v)     { this.securityCheckId = v; }
    public Long          getVisitorId()                 { return visitorId; }
    public void          setVisitorId(Long v)           { this.visitorId = v; }
    public Long          getInvitationId()              { return invitationId; }
    public void          setInvitationId(Long v)        { this.invitationId = v; }
    public LocalDate     getVisitDate()                 { return visitDate; }
    public void          setVisitDate(LocalDate v)      { this.visitDate = v; }
    public Long          getEntranceId()                { return entranceId; }
    public void          setEntranceId(Long v)          { this.entranceId = v; }
    public String        getEntranceName()              { return entranceName; }
    public void          setEntranceName(String v)      { this.entranceName = v; }
    public String        getStatus()                    { return status; }
    public void          setStatus(String v)            { this.status = v; }
    public LocalDateTime getCheckedInAt()               { return checkedInAt; }
    public void          setCheckedInAt(LocalDateTime v){ this.checkedInAt = v; }
    public String        getCheckedInBy()               { return checkedInBy; }
    public void          setCheckedInBy(String v)       { this.checkedInBy = v; }

    public String  getVisitorFirstName()                { return visitorFirstName; }
    public void    setVisitorFirstName(String v)        { this.visitorFirstName = v; }
    public String  getVisitorLastName()                 { return visitorLastName; }
    public void    setVisitorLastName(String v)         { this.visitorLastName = v; }
    public String  getVisitorCompany()                  { return visitorCompany; }
    public void    setVisitorCompany(String v)          { this.visitorCompany = v; }
    public String  getVisitorFunction()                 { return visitorFunction; }
    public void    setVisitorFunction(String v)         { this.visitorFunction = v; }

    public LocalDate getInvitationStartDate()           { return invitationStartDate; }
    public void      setInvitationStartDate(LocalDate v){ this.invitationStartDate = v; }
    public LocalDate getInvitationEndDate()             { return invitationEndDate; }
    public void      setInvitationEndDate(LocalDate v)  { this.invitationEndDate = v; }
    public String    getInviterUsername()               { return inviterUsername; }
    public void      setInviterUsername(String v)       { this.inviterUsername = v; }

    // ── GPS coordinates (populated from mobile check-ins) ────────────────────
    private Double checkinLat;
    private Double checkinLng;
    public Double  getCheckinLat()                      { return checkinLat; }
    public void    setCheckinLat(Double v)              { this.checkinLat = v; }
    public Double  getCheckinLng()                      { return checkinLng; }
    public void    setCheckinLng(Double v)              { this.checkinLng = v; }

    // ── Supervisor view (populated only in /supervisees endpoint) ─────────────
    private String responsibleGatekeeper;
    public String  getResponsibleGatekeeper()           { return responsibleGatekeeper; }
    public void    setResponsibleGatekeeper(String v)   { this.responsibleGatekeeper = v; }

    // ── Security approver (COALESCE of security_reviewer, assigned_to) ────────
    private String securityApprover;
    public String  getSecurityApprover()                { return securityApprover; }
    public void    setSecurityApprover(String v)        { this.securityApprover = v; }
}
