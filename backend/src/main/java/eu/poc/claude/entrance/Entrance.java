package eu.poc.claude.entrance;

public class Entrance {

    private Long   id;
    private String name;
    private String description;

    public Entrance() {}

    public Long   getId()              { return id; }
    public void   setId(Long id)       { this.id = id; }

    public String getName()            { return name; }
    public void   setName(String v)    { this.name = v; }

    public String getDescription()     { return description; }
    public void   setDescription(String v) { this.description = v; }
}
