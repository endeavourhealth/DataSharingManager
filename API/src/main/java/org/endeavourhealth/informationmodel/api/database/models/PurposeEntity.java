package org.endeavourhealth.informationmodel.api.database.models;

import org.endeavourhealth.core.mySQLDatabase.MapType;
import org.endeavourhealth.core.mySQLDatabase.PersistenceManager;
import org.endeavourhealth.core.mySQLDatabase.models.MasterMappingEntity;
import org.endeavourhealth.coreui.json.JsonPurpose;

import javax.persistence.*;
import javax.persistence.criteria.*;
import java.util.List;

@Entity
@Table(name = "Purpose", schema = "OrganisationManager")
public class PurposeEntity {
    private String uuid;
    private String title;
    private String detail;

    @Id
    @Column(name = "Uuid", nullable = false, length = 36)
    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    @Basic
    @Column(name = "Title", nullable = false, length = 50)
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @Basic
    @Column(name = "Detail", nullable = false, length = 2000)
    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        org.endeavourhealth.informationmodel.api.database.models.PurposeEntity that = (org.endeavourhealth.informationmodel.api.database.models.PurposeEntity) o;

        if (uuid != null ? !uuid.equals(that.uuid) : that.uuid != null) return false;
        if (title != null ? !title.equals(that.title) : that.title != null) return false;
        if (detail != null ? !detail.equals(that.detail) : that.detail != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = uuid != null ? uuid.hashCode() : 0;
        result = 31 * result + (title != null ? title.hashCode() : 0);
        result = 31 * result + (detail != null ? detail.hashCode() : 0);
        return result;
    }

    public static void savePurpose(JsonPurpose purpose) throws Exception {
        EntityManager entityManager = PersistenceManager.getEntityManager();

        org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity dsaPurpose = new org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity();
        dsaPurpose.setUuid(purpose.getUuid());
        dsaPurpose.setDetail(purpose.getDetail());
        dsaPurpose.setTitle(purpose.getTitle());
        entityManager.getTransaction().begin();
        entityManager.persist(dsaPurpose);
        entityManager.getTransaction().commit();

        entityManager.close();
    }

    public static void updatePurpose(JsonPurpose purpose) throws Exception {
        EntityManager entityManager = PersistenceManager.getEntityManager();

        org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity dsaPurpose = entityManager.find(org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity.class, purpose.getUuid());
        entityManager.getTransaction().begin();
        dsaPurpose.setTitle(purpose.getTitle());
        dsaPurpose.setDetail(purpose.getDetail());
        entityManager.getTransaction().commit();

        entityManager.close();
    }

    public static void deleteAllPurposes(String uuid, Short mapType) throws Exception {
        EntityManager entityManager = PersistenceManager.getEntityManager();

        List<String> purposes = MasterMappingEntity.getChildMappings(uuid, mapType, MapType.PURPOSE.getMapType());
        purposes.addAll(MasterMappingEntity.getChildMappings(uuid, mapType, MapType.BENEFIT.getMapType()));

        if (purposes.size() == 0)
            return;

        entityManager.getTransaction().begin();
        CriteriaBuilder criteriaBuilder  = entityManager.getCriteriaBuilder();
        CriteriaDelete<org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity> query = criteriaBuilder.createCriteriaDelete(org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity.class);
        Root<org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity> root = query.from(org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity.class);
        query.where(root.get("uuid").in(purposes));

        entityManager.createQuery(query).executeUpdate();
        entityManager.getTransaction().commit();

        entityManager.close();
    }

    public static List<org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity> getPurposesFromList(List<String> purposes) throws Exception {
        EntityManager entityManager = PersistenceManager.getEntityManager();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity> cq = cb.createQuery(org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity.class);
        Root<org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity> rootEntry = cq.from(org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity.class);

        Predicate predicate = rootEntry.get("uuid").in(purposes);

        cq.where(predicate);
        TypedQuery<org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity> query = entityManager.createQuery(cq);

        List<org.endeavourhealth.core.mySQLDatabase.models.PurposeEntity> ret = query.getResultList();

        entityManager.close();

        return ret;
    }
}
