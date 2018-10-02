package org.endeavourhealth.datasharingmanager.api.endpoints;

import com.codahale.metrics.annotation.Timed;
import io.astefanutti.metrics.aspectj.Metrics;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.endeavourhealth.common.security.SecurityUtils;
import org.endeavourhealth.common.security.annotations.RequiresAdmin;
import org.endeavourhealth.core.data.audit.UserAuditRepository;
import org.endeavourhealth.core.data.audit.models.AuditAction;
import org.endeavourhealth.core.data.audit.models.AuditModule;
import org.endeavourhealth.core.database.dal.admin.models.Organisation;
import org.endeavourhealth.coreui.endpoints.AbstractEndpoint;
import org.endeavourhealth.datasharingmanagermodel.models.database.*;
import org.endeavourhealth.datasharingmanagermodel.models.enums.MapType;
import org.endeavourhealth.datasharingmanagermodel.models.json.JsonAuthorityToShare;
import org.endeavourhealth.datasharingmanagermodel.models.json.JsonProject;
import org.endeavourhealth.datasharingmanagermodel.models.json.JsonProjectApplicationPolicy;
import org.endeavourhealth.usermanagermodel.models.caching.OrganisationCache;
import org.endeavourhealth.usermanagermodel.models.caching.UserCache;
import org.endeavourhealth.usermanagermodel.models.database.ApplicationPolicyEntity;
import org.endeavourhealth.usermanagermodel.models.database.UserProjectEntity;
import org.endeavourhealth.usermanagermodel.models.json.JsonUser;
import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.endeavourhealth.common.security.SecurityUtils.getCurrentUserId;

@Path("/project")
@Metrics(registry = "EdsRegistry")
@Api(description = "API endpoint related to the projects")
public class ProjectEndpoint extends AbstractEndpoint {
    private static final Logger LOG = LoggerFactory.getLogger(ProjectEndpoint.class);

    private static final UserAuditRepository userAudit = new UserAuditRepository(AuditModule.EdsUiModule.Organisation);

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.getProjects")
    @Path("/")
    @ApiOperation(value = "Return either all projects if no parameter is provided or search for " +
            "projects using a UUID or a search term. Search matches on name of projects. " +
            "Returns a JSON representation of the matching set of projects")
    public Response getProjects(@Context SecurityContext sc,
                                @ApiParam(value = "Optional uuid") @QueryParam("uuid") String uuid,
                                @ApiParam(value = "Optional search term") @QueryParam("searchData") String searchData
    ) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Project(s)",
                "Project UUID", uuid,
                "SearchData", searchData);


        if (uuid == null && searchData == null) {
            LOG.trace("Project - list");

            return getProjectList();
        } else if (uuid != null){
            LOG.trace("Project - single - " + uuid);
            return getSingleProject(uuid);
        } else {
            LOG.trace("Search Projects - " + searchData);
            return search(searchData);
        }
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.postProject")
    @Path("/")
    @ApiOperation(value = "Save a new project or update an existing one.  Accepts a JSON representation " +
            "of a project.")
    @RequiresAdmin
    public Response postProject(@Context SecurityContext sc,
                                 @ApiParam(value = "Json representation of project to save or update") JsonProject project
    ) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Save,
                "Project",
                "Project", project);

        if (project.getUuid() != null) {
            MasterMappingEntity.deleteAllMappings(project.getUuid());
            ProjectEntity.updateProject(project);
        } else {
            project.setUuid(UUID.randomUUID().toString());
            ProjectEntity.saveProject(project);
        }

        MasterMappingEntity.saveProjectMappings(project);

        clearLogbackMarkers();

        return Response
                .ok()
                .entity(project.getUuid())
                .build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.deleteProject")
    @Path("/")
    @ApiOperation(value = "Delete a project based on UUID that is passed to the API.  Warning! This is permanent.")
    @RequiresAdmin
    public Response deleteProject(@Context SecurityContext sc,
                                   @ApiParam(value = "UUID of the project to be deleted") @QueryParam("uuid") String uuid
    ) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Delete,
                "Project",
                "Project UUID", uuid);

        ProjectEntity.deleteProject(uuid);

        clearLogbackMarkers();
        return Response
                .ok()
                .build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.getLinkedPublishers")
    @Path("/publishers")
    @ApiOperation(value = "Returns a list of Json representations of publishers that are linked " +
            "to the project.  Accepts a UUID of a project.")
    public Response getLinkedPublishers(@Context SecurityContext sc,
                                        @ApiParam(value = "UUID of project") @QueryParam("uuid") String uuid) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Publishers(s)",
                "Project UUID", uuid);

        return getLinkedOrganisations(uuid, MapType.PUBLISHER.getMapType());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.getLinkedSubscribers")
    @Path("/subscribers")
    @ApiOperation(value = "Returns a list of Json representations of subscribers that are linked " +
            "to the project.  Accepts a UUID of a project.")
    public Response getLinkedSubscribers(@Context SecurityContext sc,
                                         @ApiParam(value = "UUID of project") @QueryParam("uuid") String uuid) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Subscribers(s)",
                "Project UUID", uuid);

        return getLinkedOrganisations(uuid, MapType.SUBSCRIBER.getMapType());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.getLinkedDsasForProject")
    @Path("/dsas")
    @ApiOperation(value = "Returns a list of Json representations of Data Sharing Agreements that are linked " +
            "to the project.  Accepts a UUID of a project.")
    public Response getLinkedDsasForProject(@Context SecurityContext sc,
                                             @ApiParam(value = "UUID of project") @QueryParam("uuid") String uuid) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "DSA(s)",
                "Project UUID", uuid);

        return getLinkedDsas(uuid);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.getBasePopulations")
    @Path("/basePopulations")
    @ApiOperation(value = "Returns a list of Json representations of base populations that are linked " +
            "to the project.  Accepts a UUID of a project.")
    public Response getBasePopulations(@Context SecurityContext sc,
                                           @ApiParam(value = "UUID of project") @QueryParam("uuid") String uuid) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Base Population(s)",
                "Project UUID", uuid);

        return getBasePopulations(uuid);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.getDataSets")
    @Path("/dataSets")
    @ApiOperation(value = "Returns a list of Json representations of data sets that are linked " +
            "to the project.  Accepts a UUID of a project.")
    public Response getDataSets(@Context SecurityContext sc,
                                       @ApiParam(value = "UUID of project") @QueryParam("uuid") String uuid) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Data set(s)",
                "Project UUID", uuid);

        return getDataSets(uuid);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="UserManager.ProjectEndpoint.getProjectApplicationPolicy")
    @Path("/projectApplicationPolicy")
    @ApiOperation(value = "Returns the application policy associated with the project")
    public Response getProjectApplicationPolicy(@Context SecurityContext sc,
                                             @ApiParam(value = "Project id to get the application policy for") @QueryParam("projectUuid") String projectUuid) throws Exception {
        super.setLogbackMarkers(sc);

        userAudit.save(getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "User application policy", "User Id", projectUuid);

        LOG.trace("getUser");

        ProjectApplicationPolicyEntity projectPolicy = ProjectApplicationPolicyEntity.getProjectApplicationPolicyId(projectUuid);
        if (projectPolicy == null) {
            projectPolicy = new ProjectApplicationPolicyEntity();
        }

        AbstractEndpoint.clearLogbackMarkers();
        return Response
                .ok()
                .entity(projectPolicy)
                .build();
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="UserManager.ProjectEndpoint.setProjectApplicationPolicy")
    @Path("/setProjectApplicationPolicy")
    @RequiresAdmin
    @ApiOperation(value = "Saves application policy associated with a project")
    public Response setUserApplicationPolicy(@Context SecurityContext sc, JsonProjectApplicationPolicy projectApplicationPolicy) throws Exception {
        super.setLogbackMarkers(sc);

        userAudit.save(getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Project application policy", "Project application policy", projectApplicationPolicy);

        LOG.trace("getUser");

        ProjectApplicationPolicyEntity.saveProjectApplicationPolicyId(projectApplicationPolicy);

        AbstractEndpoint.clearLogbackMarkers();
        return Response
                .ok()
                .build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="UserManager.ProjectEndpoint.getApplicationPolicies")
    @Path("/getApplicationPolicies")
    @ApiOperation(value = "Returns a list of application policies")
    public Response getApplicationPolicies(@Context SecurityContext sc) throws Exception {

        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "application policy(s)");

        List<ApplicationPolicyEntity> applicationPolicies = ApplicationPolicyEntity.getAllApplicationPolicies();

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(applicationPolicies)
                .build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.getUsers")
    @Path("/getUsers")
    @ApiOperation(value = "Returns a list of available users to assign to the project lead or technical lead")
    public Response getUsers(@Context SecurityContext sc) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Users");

        return getUsers();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="DataSharingManager.ProjectEndpoint.getUsersAssignedToProject")
    @Path("/getUsersAssignedToProject")
    @ApiOperation(value = "Returns a list of Json representations of subscribers that are linked " +
            "to the project.  Accepts a UUID of a project.")
    public Response getUsersAssignedToProject(@Context SecurityContext sc,
                                              @ApiParam(value = "Project id to get the application policy for") @QueryParam("projectUuid") String projectUuid) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Users assigned to project");

        return getUsersAssignedToProject(projectUuid);
    }

    private Response getUsersAssignedToProject(String projectUuid) throws Exception {

        List<UserProjectEntity> userProjects = UserProjectEntity.getUserProjectEntitiesForProject(projectUuid);

        List<JsonAuthorityToShare> authorities = new ArrayList<>();

        for (UserProjectEntity userProject : userProjects) {
            JsonAuthorityToShare auth = authorities.stream().filter(a -> a.getOrganisationId().equals(userProject.getOrganisationId())).findFirst().orElse(new JsonAuthorityToShare());
            if (auth.getOrganisationId() == null) {
                OrganisationEntity org = OrganisationCache.getOrganisationDetails(userProject.getOrganisationId());
                auth.setOrganisationId(org.getUuid());
                auth.setOrganisationName(org.getName());
                auth.setOrganisationOdsCode(org.getOdsCode());

                authorities.add(auth);
            }
            UserRepresentation u = UserCache.getUserDetails(userProject.getUserId());
            JsonUser jsonUser = new JsonUser(u);
            auth.addUser(jsonUser);

        }

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(authorities)
                .build();
    }

    private Response getUsers() throws Exception {

        List<JsonUser> users = UserCache.getAllUsers();

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(users)
                .build();
    }

    private Response getProjectList() throws Exception {

        List<ProjectEntity> dataFlows = ProjectEntity.getAllProjects();

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(dataFlows)
                .build();
    }

    private Response getSingleProject(String uuid) throws Exception {
        ProjectEntity dataFlow = ProjectEntity.getProject(uuid);

        return Response
                .ok()
                .entity(dataFlow)
                .build();

    }

    private Response search(String searchData) throws Exception {
        Iterable<ProjectEntity> projects = ProjectEntity.search(searchData);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(projects)
                .build();
    }

    private Response getLinkedDsas(String projectId) throws Exception {

        List<DataSharingAgreementEntity> ret = ProjectEntity.getLinkedDsas(projectId);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(ret)
                .build();
    }

    private Response getBasePopulations(String projectId) throws Exception {

        List<CohortEntity> ret = ProjectEntity.getBasePopulations(projectId);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(ret)
                .build();
    }

    private Response getDataSets(String projectId) throws Exception {

        List<DatasetEntity> ret = ProjectEntity.getDataSets(projectId);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(ret)
                .build();
    }

    private Response getLinkedOrganisations(String projectId, Short mapType) throws Exception {

        List<OrganisationEntity> ret = ProjectEntity.getLinkedOrganisations(projectId, mapType);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(ret)
                .build();
    }
}
