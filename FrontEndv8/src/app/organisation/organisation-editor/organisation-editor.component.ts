import {Component, OnInit} from '@angular/core';
import {OrganisationService} from '../organisation.service';
import {ActivatedRoute, Router} from '@angular/router';
import { DatePipe } from '@angular/common';
import {Region} from "../../models/Region";
import {Dpa} from "../../models/Dpa";
import {Dsa} from "../../models/Dsa";
import {OrganisationType} from "../../models/OrganisationType";
import {UserProject} from "dds-angular8/lib/user-manager/models/UserProject";
import {LoggerService, UserManagerService} from "dds-angular8";
import {Organisation} from "../../models/Organisation";
import {Address} from "../../models/Address";

@Component({
  selector: 'app-organisation-editor',
  templateUrl: './organisation-editor.component.html',
  styleUrls: ['./organisation-editor.component.css']
})
export class OrganisationEditorComponent implements OnInit {
  public accordionClass = 'accordionClass';
  private paramSubscriber: any;

  region: Region = <Region>{};
  organisation: Organisation = <Organisation>{};
  regions: Region[] = [];
  childOrganisations: Organisation[] = [];
  parentOrganisations: Organisation[] = [];
  services: Organisation[] = [];
  addresses: Address[] = [];
  dpaPublishing: Dpa[] = [];
  dsaPublishing: Dsa[] = [];
  dsaSubscribing: Dsa[] = [];
  organisationTypes: OrganisationType[];
  location: any;
  orgType = 'Organisation';
  allowEdit = false;
  superUser = false;
  userId: string;

  public activeProject: UserProject;

  orgDetailsToShow = new Organisation().getDisplayItems();
  regionDetailsToShow = new Region().getDisplayItems();
  dpaDetailsToShow = new Dpa().getDisplayItems();
  dsaDetailsToShow = new Dsa().getDisplayItems();

  constructor(private log: LoggerService,
              private organisationService: OrganisationService,
              private router: Router,
              private route: ActivatedRoute,
              private userManagerNotificationService: UserManagerService,
              private datePipe: DatePipe) { }

  ngOnInit() {

    this.userManagerNotificationService.onProjectChange.subscribe(active => {
      this.activeProject = active;
      this.roleChanged();
    });
  }

  roleChanged() {


    if (this.activeProject.applicationPolicyAttributes.find(x => x.applicationAccessProfileName == 'Super User') != null) {
      this.allowEdit = true;
      this.superUser = true;
      this.userId = null;
    } else if (this.activeProject.applicationPolicyAttributes.find(x => x.applicationAccessProfileName == 'Admin') != null) {
      this.allowEdit = true;
      this.superUser = false;
      this.userId = this.activeProject.userId;
    } else {
      this.allowEdit = false;
      this.superUser = false;
      this.userId = this.activeProject.userId;
    }

    this.getOrganisationTypes();
    this.paramSubscriber = this.route.params.subscribe(
      params => {
        this.performAction(params['mode'], params['id']);
      });
  }

  protected performAction(action: string, itemUuid: string) {
    switch (action) {
      case 'add':
        this.create(itemUuid);
        break;
      case 'addService':
        this.createService(itemUuid);
        break;
      case 'edit':
        this.load(itemUuid);
        break;
    }
  }

  createService(uuid: string) {
    const vm = this;
    this.orgType = 'Service';
    this.organisation = {
      name: '',
      isService: 1,
      bulkImported : 0,
      bulkItemUpdated : 0
    } as Organisation;
  }

  createServiceFromOrg() {
    const vm = this;
    const parent: Organisation = (JSON.parse(JSON.stringify(this.organisation)));
    this.services = null;
    this.childOrganisations = null;
    this.regions = null;
    this.parentOrganisations = [];
    this.parentOrganisations.push(parent);
    this.organisation.uuid = null;
    this.organisation.isService = 1;
    this.orgType = 'Service';
    this.addresses = [];
  }

  create(uuid: string) {
    this.organisation = {
      name: '',
      isService: 0,
      bulkImported : 0,
      bulkItemUpdated : 0
    } as Organisation;
    this.addresses = [];

  }

  load(uuid: string) {
    const vm = this;
    this.organisationService.getOrganisation(uuid)
      .subscribe(result =>  {
          this.organisation = result;
          this.organisation.dateOfRegistration = this.datePipe.transform(this.organisation.dateOfRegistration,"yyyy-MM-dd");
          if (this.organisation.isService) {
            this.orgType = 'Service';
          } else { // only get these for organisations, not services
            this.getOrganisationRegions();
            this.getOrganisationAddresses();
            this.getChildOrganisations();
            this.getServices();
            this.getDPAsPublishingTo();
            this.getDSAsPublishingTo();
            this.getDSAsSubscribingTo();
          }
          this.getParentOrganisations();
        },
        error => this.log.error('The organisation could not be loaded. Please try again.')
      );
  }

  save(close: boolean) {
    const vm = this;
    // Populate organisations regions before save
    this.organisation.regions = {};
    for (const idx in this.regions) {
      const region: Region = this.regions[idx];
      this.organisation.regions[region.uuid] = region.name;
    }

    this.organisation.childOrganisations = {};
    for (const idx in this.childOrganisations) {
      const org: Organisation = this.childOrganisations[idx];
      this.organisation.childOrganisations[org.uuid] = org.name;
    }

    this.organisation.parentOrganisations = {};
    for (const idx in this.parentOrganisations) {
      const org: Organisation = this.parentOrganisations[idx];
      this.organisation.parentOrganisations[org.uuid] = org.name;
    }

    this.organisation.services = {};
    for (const idx in this.services) {
      const org: Organisation = this.services[idx];
      this.organisation.services[org.uuid] = org.name;
    }

    this.organisation.dpaPublishing = {};
    for (const idx in this.dpaPublishing) {
      const dpa: Dpa = this.dpaPublishing[idx];
      this.organisation.dpaPublishing[dpa.uuid] = dpa.name;
    }

    this.organisation.dsaPublishing = {};
    for (const idx in this.dsaPublishing) {
      const dsa: Dsa = this.dsaPublishing[idx];
      this.organisation.dsaPublishing[dsa.uuid] = dsa.name;
    }

    this.organisation.dsaSubscribing = {};
    for (const idx in this.dsaSubscribing) {
      const dsa: Dsa = this.dsaSubscribing[idx];
      this.organisation.dsaSubscribing[dsa.uuid] = dsa.name;
    }

    // Populate Addresses before save
    this.organisation.addresses = this.addresses;


    this.organisationService.saveOrganisation(this.organisation)
      .subscribe(saved => {
          this.organisation.uuid = saved;
          this.log.success('Organisation saved successfully.');
          if (close) { window.history.back(); }
        },
        error => this.log.error('The organisation could not be saved. Please try again.')
      );
  }

  close() {
    window.history.back();
  }

  addAddress() {
    const vm = this;
    const address: Address = <Address>{};
    address.uuid = null;
    address.organisationUuid = this.organisation.uuid;
    address.buildingName = '';
    address.numberAndStreet = '';
    address.locality = '';
    address.city = '';
    address.county = '';
    address.postcode = '';
    address.lat = null;
    address.lng = null;
    address.geolocationReprocess = null;
    this.addresses.push(address);

  }

  /*private editRegions() {
    const vm = this;
    RegionPickerComponent.open(this.$modal, this.regions)
      .result.then(function (result: Region[]) {
      this.regions = result;
    });
  }

  private editChildOrganisations() {
    const vm = this;
    OrganisationPickerComponent.open(this.$modal, this.childOrganisations, 'organisation', this.organisation.uuid )
      .result.then(function (result: Organisation[]) {
      this.childOrganisations = result;
    });
  }

  private editParentOrganisations() {
    const vm = this;
    OrganisationPickerComponent.open(this.$modal, this.parentOrganisations, 'organisation', this.organisation.uuid )
      .result.then(function (result: Organisation[]) {
      this.parentOrganisations = result;
    });
  }

  private editServices() {
    const vm = this;
    OrganisationPickerComponent.open(this.$modal, this.services, 'services', this.organisation.uuid )
      .result.then(function (result: Organisation[]) {
      this.services = result;
    });
  }

  private editDPAPublishing() {
    const vm = this;
    DataProcessingAgreementPickerComponent.open(this.$modal, this.dpaPublishing)
      .result.then(function (result: Dpa[]) {
      this.dpaPublishing = result;
    });
  }

  private editDSAPublishing() {
    const vm = this;
    DataSharingAgreementPickerComponent.open(this.$modal, this.dsaPublishing)
      .result.then(function (result: Dsa[]) {
      this.dsaPublishing = result;
    });
  }

  private editDSASubscribing() {
    const vm = this;
    DataSharingAgreementPickerComponent.open(this.$modal, this.dsaSubscribing)
      .result.then(function (result: Dsa[]) {
      this.dsaSubscribing = result;
    });
  }*/

  private getOrganisationRegions() {
    const vm = this;
    this.organisationService.getOrganisationRegions(this.organisation.uuid, this.userId)
      .subscribe(
        result => this.regions = result,
        error => this.log.error('The associated regions could not be loaded. Please try again.')
      );
  }

  private getOrganisationAddresses() {
    const vm = this;
    this.organisationService.getOrganisationAddresses(this.organisation.uuid)
      .subscribe(
        result => this.addresses = result,
        error => this.log.error('The address details could not be loaded. Please try again.')
      );
  }

  private getChildOrganisations() {
    const vm = this;
    this.organisationService.getChildOrganisations(this.organisation.uuid)
      .subscribe(
        result => this.childOrganisations = result,
        error => this.log.error('The child organisations could not be loaded. Please try again.')
      );
  }

  private getParentOrganisations() {
    this.organisationService.getParentOrganisations(this.organisation.uuid, this.organisation.isService)
      .subscribe(
        result => this.parentOrganisations = result,
        error => this.log.error('The parent organisations could not be loaded. Please try again.')
      );
  }

  private getServices() {
    const vm = this;
    this.organisationService.getServices(this.organisation.uuid)
      .subscribe(
        result => this.services = result,
        error => this.log.error('The associated services could not be loaded. Please try again.')
      );
  }

  private getOrganisationTypes() {
    const vm = this;
    this.organisationService.getOrganisationTypes()
      .subscribe(
        result => {this.organisationTypes = result;
        },
        error => this.log.error('The organisation types could not be loaded. Please try again.')
      );
  }

  private getDPAsPublishingTo() {
    const vm = this;
    this.organisationService.getDPAPublishing(this.organisation.uuid)
      .subscribe(
        result => this.dpaPublishing = result,
        error => this.log.error('The associated publishing data processing agreements could not be loaded. Please try again.')
      );
  }

  private getDSAsPublishingTo() {
    const vm = this;
    this.organisationService.getDSAPublishing(this.organisation.uuid)
      .subscribe(
        result => this.dsaPublishing = result,
        error => this.log.error('The associated publishing data sharing agreements could not be loaded. Please try again.')
      );
  }

  private getDSAsSubscribingTo() {
    const vm = this;
    this.organisationService.getDSASubscribing(this.organisation.uuid)
      .subscribe(
        result => this.dsaSubscribing = result,
        error => this.log.error('The associated subscribing data sharing agreements could not be loaded. Please try again.')
      );
  }

  deleteAddress(address: Address) {
    const index = this.addresses.findIndex(a => a.uuid === address.uuid);
    if (index > -1) {
      this.addresses.splice(index, 1);
    }
  }

  editOrganisation(item: Organisation) {
    this.router.navigate(['/organisation', item.uuid, 'edit']);
  }

  editRegion(item: Organisation) {
    this.router.navigate(['/region', item.uuid, 'edit']);
  }
}
