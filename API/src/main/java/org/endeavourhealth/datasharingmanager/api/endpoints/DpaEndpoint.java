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
import org.endeavourhealth.coreui.endpoints.AbstractEndpoint;
import org.endeavourhealth.datasharingmanager.api.database.MapType;
import org.endeavourhealth.datasharingmanager.api.database.models.*;
import org.endeavourhealth.datasharingmanager.api.json.JsonDPA;
import org.endeavourhealth.datasharingmanager.api.json.JsonDocumentation;
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

@Path("/dpa")
@Metrics(registry = "EdsRegistry")
@Api(description = "API endpoint related to the data processing agreements")
public final class DpaEndpoint extends AbstractEndpoint {
    private static final Logger LOG = LoggerFactory.getLogger(DpaEndpoint.class);

    private static final UserAuditRepository userAudit = new UserAuditRepository(AuditModule.EdsUiModule.Organisation);


    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="EDS-UI.DpaEndpoint.Get")
    @Path("/")
    @ApiOperation(value = "Return either all data processing agreements if no parameter is provided or search for " +
            "data processing agreements using a UUID or a search term. Search matches on name or description of data processing agreement. " +
            "Returns a JSON representation of the matching set of Data processing agreement")
    public Response get(@Context SecurityContext sc,
                        @ApiParam(value = "Optional uuid") @QueryParam("uuid") String uuid,
                        @ApiParam(value = "Optional search term") @QueryParam("searchData") String searchData
    ) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "DPA(s)",
                "DPA Id", uuid,
                "SearchData", searchData);


        if (uuid == null && searchData == null) {
            LOG.trace("getDPA - list");
            return getDPAList();
        } else if (uuid != null){
            LOG.trace("getDPA - single - " + uuid);
            return getSingleDPA(uuid);
        } else {
            LOG.trace("Search DPA - " + searchData);
            return search(searchData);
        }
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="EDS-UI.DpaEndpoint.Post")
    @Path("/")
    @ApiOperation(value = "Save a new data processing agreement or update an existing one.  Accepts a JSON representation " +
            "of a data processing agreement.")
    @RequiresAdmin
    public Response post(@Context SecurityContext sc,
                         @ApiParam(value = "Json representation of data processing agreement to save or update") JsonDPA dpa) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Save,
                "DPA",
                "DPA", dpa);

        if (dpa.getUuid() != null) {
            MasterMappingEntity.deleteAllMappings(dpa.getUuid());
            DataProcessingAgreementEntity.updateDPA(dpa);
        } else {
            dpa.setUuid(UUID.randomUUID().toString());
            DataProcessingAgreementEntity.saveDPA(dpa);
        }

        for (JsonDocumentation doc : dpa.getDocumentations()) {
            if (doc.getUuid() != null) {
                DocumentationEntity.updateDocument(doc);
            } else {
                doc.setUuid(UUID.randomUUID().toString());
                DocumentationEntity.saveDocument(doc);
            }
        }

        MasterMappingEntity.saveDataProcessingAgreementMappings(dpa);

        clearLogbackMarkers();

        return Response
                .ok()
                .entity(dpa.getUuid())
                .build();
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="EDS-UI.DpaEndpoint.Delete")
    @Path("/")
    @ApiOperation(value = "Delete a data processing agreement based on UUID that is passed to the API.  Warning! This is permanent.")
    @RequiresAdmin
    public Response delete(@Context SecurityContext sc,
                           @ApiParam(value = "UUID of the data processing agreement to be deleted") @QueryParam("uuid") String uuid
    ) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Delete,
                "DPA",
                "DPA Id", uuid);

        DataProcessingAgreementEntity.deleteDPA(uuid);

        clearLogbackMarkers();
        return Response
                .ok()
                .build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="EDS-UI.DpaEndpoint.GetDataFlows")
    @Path("/dataflows")
    @ApiOperation(value = "Returns a list of Json representations of data flow agreements that are linked " +
            "to the data processing agreeement.  Accepts a UUID of a data processing agreement.")
    public Response getLinkedDataFlows(@Context SecurityContext sc,
                                       @ApiParam(value = "UUID of data processing agreement") @QueryParam("uuid") String uuid
    ) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "dataflows(s)",
                "DPA Id", uuid);

        return getLinkedDataFlows(uuid);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="EDS-UI.DpaEndpoint.GetCohorts")
    @Path("/cohorts")
    @ApiOperation(value = "Returns a list of Json representations of cohorts that are linked " +
            "to the data processing agreeement.  Accepts a UUID of a data processing agreement.")
    public Response getLinkedCohorts(@Context SecurityContext sc,
                                     @ApiParam(value = "UUID of data processing agreement") @QueryParam("uuid") String uuid
    ) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "cohorts(s)",
                "DPA Id", uuid);

        return getLinkedCohorts(uuid);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @Timed(absolute = true, name="EDS-UI.DpaEndpoint.GetDataSets")
    @Path("/datasets")
    @ApiOperation(value = "Returns a list of Json representations of data sets that are linked " +
            "to the data processing agreeement.  Accepts a UUID of a data processing agreement.")
    public Response getLinkedDataSets(@Context SecurityContext sc,
                                      @ApiParam(value = "UUID of data processing agreement") @QueryParam("uuid") String uuid
    ) throws Exception {
        super.setLogbackMarkers(sc);
        userAudit.save(SecurityUtils.getCurrentUserId(sc), getOrganisationUuidFromToken(sc), AuditAction.Load,
                "Data Sets(s)",
                "DPA Id", uuid);

        return getLinkedDataSets(uuid);
    }

    private Response getDPAList() throws Exception {

        List<DataProcessingAgreementEntity> dpas = DataProcessingAgreementEntity.getAllDPAs();

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(dpas)
                .build();
    }

    private Response getSingleDPA(String uuid) throws Exception {
        DataProcessingAgreementEntity dpaEntity = DataProcessingAgreementEntity.getDPA(uuid);

        return Response
                .ok()
                .entity(dpaEntity)
                .build();

    }

    private Response search(String searchData) throws Exception {
        Iterable<DataProcessingAgreementEntity> dpas = DataProcessingAgreementEntity.search(searchData);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(dpas)
                .build();
    }

    private Response getLinkedDataFlows(String dpaUuid) throws Exception {

        List<String> dataFlowUuids = MasterMappingEntity.getParentMappings(dpaUuid, MapType.DATAPROCESSINGAGREEMENT.getMapType(), MapType.DATAFLOW.getMapType());
        List<DataFlowEntity> ret = new ArrayList<>();

        if (dataFlowUuids.size() > 0)
            ret = DataFlowEntity.getDataFlowsFromList(dataFlowUuids);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(ret)
                .build();
    }

    private Response getLinkedCohorts(String dpaUuid) throws Exception {
        List<String> cohorts = MasterMappingEntity.getChildMappings(dpaUuid, MapType.DATAPROCESSINGAGREEMENT.getMapType(), MapType.COHORT.getMapType());

        List<CohortEntity> ret = new ArrayList<>();

        if (cohorts.size() > 0)
            ret = CohortEntity.getCohortsFromList(cohorts);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(ret)
                .build();
    }

    private Response getLinkedDataSets(String dpaUuid) throws Exception {
        List<String> datasets = MasterMappingEntity.getChildMappings(dpaUuid, MapType.DATAPROCESSINGAGREEMENT.getMapType(), MapType.DATASET.getMapType());

        List<DatasetEntity> ret = new ArrayList<>();

        if (datasets.size() > 0)
            ret = DatasetEntity.getDataSetsFromList(datasets);

        clearLogbackMarkers();
        return Response
                .ok()
                .entity(ret)
                .build();
    }
}
