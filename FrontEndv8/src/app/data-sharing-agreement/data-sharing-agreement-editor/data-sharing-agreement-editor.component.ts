import {Component, OnInit, ViewChild} from '@angular/core';
import {DatePipe} from '@angular/common';
import {MatDialog} from "@angular/material/dialog";
import {ActivatedRoute, Router} from '@angular/router';
import {GenericTableComponent, LoggerService, MessageBoxDialogComponent, UserManagerService} from "dds-angular8";
import {UserProject} from "dds-angular8/lib/user-manager/models/UserProject";
import {Dsa} from '../models/Dsa';
import {DataSharingAgreementService} from '../data-sharing-agreement.service';
//import {DataFlow} from '../../data-flow/models/DataFlow';
//import {DataflowPickerComponent} from '../../data-flow/dataflow-picker/dataflow-picker.component';
import {Purpose} from '../../models/Purpose';
import {PurposeComponent} from "../../purpose/purpose/purpose.component";
import {Region} from '../../region/models/Region';
import {Marker} from '../../region/models/Marker';
import {RegionPickerComponent} from '../../region/region-picker/region-picker.component';
import {Project} from "../../project/models/Project";
import {ProjectPickerComponent} from "../../project/project-picker/project-picker.component";
import {Organisation} from '../../organisation/models/Organisation';
import {OrganisationPickerComponent} from '../../organisation/organisation-picker/organisation-picker.component';
import {Documentation} from "../../documentation/models/Documentation";
import {DocumentationService} from "../../documentation/documentation.service";
import {DocumentationComponent} from "../../documentation/documentation/documentation.component";
import {DataSharingAgreementDialogComponent} from "src/app/data-sharing-agreement/data-sharing-agreement-dialog/data-sharing-agreement-dialog.component";

@Component({
  selector: 'app-data-sharing-agreement-editor',
  templateUrl: './data-sharing-agreement-editor.component.html',
  styleUrls: ['./data-sharing-agreement-editor.component.css']
})

export class DataSharingAgreementEditorComponent implements OnInit {
  private paramSubscriber: any;

  dsa: Dsa = <Dsa>{};
  //dataFlows: DataFlow[] = [];
  purposes: Purpose[] = [];
  benefits: Purpose[] = [];
  regions: Region[] = [];
  projects: Project[] = [];
  publishers: Organisation[] = [];
  subscribers: Organisation[] = [];
  documentations: Documentation[] = [];

  publisherMarkers: Marker[];
  subscriberMarkers: Marker[];
  mapMarkers: Marker[] = [];
  showPub = true;
  allowEdit = false;
  disableStatus = false;
  superUser = false;
  userId: string;

  model = 1;

  public activeProject: UserProject;

  status = [
    {num: 0, name : 'Active'},
    {num: 1, name : 'Inactive'}
  ];

  consents = [
    {num: 0, name : 'Explicit Consent'},
    {num: 1, name : 'Implied Consent'}
  ];

  //dataflowDetailsToShow = new DataFlow().getDisplayItems();
  purposeDetailsToShow = new Purpose().getDisplayItems();
  benefitDetailsToShow = new Purpose().getDisplayItems();
  regionDetailsToShow = new Region().getDisplayItems();
  projectDetailsToShow = new Project().getDisplayItems();
  publisherDetailsToShow = new Organisation().getDisplayItems();
  subscriberDetailsToShow = new Organisation().getDisplayItems();
  documentDetailsToShow = new Documentation().getDisplayItems();

  @ViewChild('purposesTable', {static: false}) purposesTable: GenericTableComponent;
  @ViewChild('benefitsTable', {static: false}) benefitsTable: GenericTableComponent;
  @ViewChild('projectsTable', {static: false}) projectsTable: GenericTableComponent;
  @ViewChild('regionsTable', {static: false}) regionsTable: GenericTableComponent;
  @ViewChild('publishersTable', {static: false}) publishersTable: GenericTableComponent;
  @ViewChild('subscribersTable', {static: false}) subscribersTable: GenericTableComponent;
  @ViewChild('documentationsTable', {static: false}) documentationsTable: GenericTableComponent;

  constructor(private log: LoggerService,
              private dsaService: DataSharingAgreementService,
              private documentationService: DocumentationService,
              private router: Router,
              private route: ActivatedRoute,
              private userManagerNotificationService: UserManagerService,
              private datePipe: DatePipe,
              public dialog: MatDialog) {
  }

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
      case 'edit':
        this.load(itemUuid);
        break;
    }
  }

  create(uuid: string) {
    this.dsa = {
      name : ''
    } as Dsa;
  }

  load(uuid: string) {
    this.dsaService.getDsa(uuid)
      .subscribe(result =>  {
          this.dsa = result;
          this.dsa.startDate = this.datePipe.transform(this.dsa.startDate,"yyyy-MM-dd");
          this.dsa.endDate = this.datePipe.transform(this.dsa.endDate,"yyyy-MM-dd");
          this.checkEndDate();
          //this.getLinkedDataFlows();
          this.getPurposes();
          this.getBenefits();
          this.getLinkedRegions();
          this.getProjects();
          this.getPublishers();
          this.getSubscribers();
          this.getPublisherMarkers();
          this.getSubscriberMarkers();
          this.getAssociatedDocumentation();
        },
        error => this.log.error('The data sharing agreement could not be loaded. Please try again.'/*, error, 'Load data sharing agreement'*/)
      );
  }

  checkEndDate() {
    if (this.dsa.endDate === null) {
      this.disableStatus = false;
      return;
    }

    let today = new Date();
    today.setHours(0,0,0,0);
    let endDate = new Date(this.dsa.endDate);

    if (endDate < today) {
      this.dsa.dsaStatusId = 1;
      this.disableStatus = true;
    } else {
      this.disableStatus = false;
    }
  }

  save(close: boolean) {

    /*// Populate data flows before save
    vm.dsa.dataFlows = {};
    for (const idx in this.dataFlows) {
      const dataflow: DataFlow = this.dataFlows[idx];
      this.dsa.dataFlows[dataflow.uuid] = dataflow.name;
    }*/

    // Populate purposes before save
    this.dsa.purposes = [];
    this.dsa.purposes = this.purposes;

    // Populate benefits before save
    this.dsa.benefits = [];
    this.dsa.benefits = this.benefits;

    // Populate regions before save
    this.dsa.regions = {};
    for (const idx in this.regions) {
      const region: Region = this.regions[idx];
      this.dsa.regions[region.uuid] = region.name;
    }

    // Populate projects before save
    this.dsa.projects = {};
    for (const idx in this.projects) {
      const proj: Project = this.projects[idx];
      this.dsa.projects[proj.uuid] = proj.name;
    }

    // Populate publishers before save
    this.dsa.publishers = {};
    for (const idx in this.publishers) {
      const pub: Organisation = this.publishers[idx];
      this.dsa.publishers[pub.uuid] = pub.name;
    }

    // Populate subscribers before save
    this.dsa.subscribers = {};
    for (const idx in this.subscribers) {
      const sub: Organisation = this.subscribers[idx];
      this.dsa.subscribers[sub.uuid] = sub.name;
    }

    // Populate documents before save
    this.dsa.documentations = [];
    this.dsa.documentations = this.documentations;

    this.dsaService.saveDsa(this.dsa)
      .subscribe(saved => {
          this.dsa.uuid = saved;
          this.log.success('Data sharing agreement saved'/*, vm.dsa, 'Save data sharing agreement'*/);

          if (close) {this.close();}
        },
        error => this.log.error('The data sharing agreement could not be saved. Please try again.'/*, error, 'Save data sharing agreement'*/)
      );
  }

  close() {
    window.history.back();
  }

  purposeClicked(item: Purpose) {
    let index = this.purposes.indexOf(item);
    this.addPurpose(index);
  }

  benefitClicked(item: Purpose) {
    let index = this.benefits.indexOf(item);
    this.addBenefit(index);
  }

  regionClicked(item: Organisation) {
    this.router.navigate(['/region', item.uuid, 'edit']);
  }

  projectClicked(item: Project) {
    this.router.navigate(['/project', item.uuid, 'edit']);
  }

  publisherClicked(item: Organisation) {
    this.router.navigate(['/organisation', item.uuid, 'edit']);
  }

  subscriberClicked(item: Organisation) {
    this.router.navigate(['/organisation', item.uuid, 'edit']);
  }

  documentationClicked(item: Documentation) {
    // Nothing needs to be done with this for the time being
  }

  /*private getLinkedDataFlows() {
    const vm = this;
    vm.dsaService.getLinkedDataFlows(vm.dsa.uuid)
      .subscribe(
        result => vm.dataFlows = result,
        error => vm.log.error('The associated data flows could not be loaded. Please try again.', error, 'Load associated data flows')
      );
  }*/

  private getLinkedRegions() {
    this.dsaService.getLinkedRegions(this.dsa.uuid, this.userId)
      .subscribe(
        result => this.regions = result,
        error => this.log.error('The associated regions could not be loaded. Please try again.'/*, error, 'Load associated regions'*/)
      );
  }

  private getPublishers() {
    this.dsaService.getPublishers(this.dsa.uuid)
      .subscribe(
        result => this.publishers = result,
        error => this.log.error('The associated publishers could not be loaded. Please try again.'/*, error, 'Load associated publishers'*/)
      );
  }

  private getProjects() {
    this.dsaService.getProjects(this.dsa.uuid)
      .subscribe(
        result => this.projects = result,
        error => this.log.error('The associated projects could not be loaded. Please try again.'/*, error, 'Load associated projects'*/)
      );
  }

  private getSubscribers() {
    this.dsaService.getSubscribers(this.dsa.uuid)
      .subscribe(
        result => this.subscribers = result,
        error => this.log.error('The associated subscribers could not be loaded. Please try again.'/*, error, 'Load associated subscribers'*/)
      );
  }

  private getPurposes() {
    this.dsaService.getPurposes(this.dsa.uuid)
      .subscribe(
        result => this.purposes = result,
        error => this.log.error('The associated purposes could not be loaded. Please try again.'/*, error, 'Load associated purposes'*/)
      );
  }

  private getBenefits() {
    this.dsaService.getBenefits(this.dsa.uuid)
      .subscribe(
        result => this.benefits = result,
        error => this.log.error('The associated benefits could not be loaded. Please try again.'/*, error, 'Load associated benefits'*/)
      );
  }

  private getAssociatedDocumentation() {
    this.documentationService.getAllAssociatedDocuments(this.dsa.uuid, '3')
      .subscribe(
        result => this.documentations = result,
        error => this.log.error('The associated documentation could not be loaded. Please try again.'/*, error, 'Load associated documentation'*/)
      );
  }

  private getSubscriberMarkers() {
    this.dsaService.getSubscriberMarkers(this.dsa.uuid)
      .subscribe(
        result => {
          this.subscriberMarkers = result;
        },
        error => this.log.error('The associated subscriber map data could not be loaded. Please try again.'/*, error, 'Load subscriber map data'*/)
      )
  }

  private getPublisherMarkers() {
    this.dsaService.getPublisherMarkers(this.dsa.uuid)
      .subscribe(
        result => {
          this.mapMarkers = result;
          this.publisherMarkers = result;
        },
        error => this.log.error('The associated publisher map data could not be loaded. Please try again.'/*, error, 'Load publisher map data'*/)
      )
  }

  deletePurposes() {
    MessageBoxDialogComponent.open(this.dialog, 'Delete purpose', 'Are you sure you want to delete purpose(s)?',
      'Delete purpose', 'Cancel')
      .subscribe(
        (result) => {
          if(result) {
            for (var i = 0; i < this.purposesTable.selection.selected.length; i++) {
              let purpose = this.purposesTable.selection.selected[i];
              this.purposes.forEach( (item, index) => {
                if(item === purpose) this.purposes.splice(index,1);
              });
            }
            this.purposesTable.updateRows();
            this.clearMappings();
            this.dsa.purposes = [];
            this.dsa.purposes = this.purposes;
            this.updateMappings('Purposes');
          } else {
            this.log.success('Delete cancelled.')
          }
        },
      );

  }

  addPurpose(index: number) {
    const dialogRef = this.dialog.open(PurposeComponent, {
      height: '580px',
      width: '550px',
      data: {resultData: this.purposes, type: 'Purpose', index: index},
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.purposes = result;
        this.purposesTable.updateRows();
        this.clearMappings();
        this.dsa.purposes = [];
        this.dsa.purposes = this.purposes;
        this.updateMappings('Purposes');
      }
    });
  }

  deleteBenefits() {
    MessageBoxDialogComponent.open(this.dialog, 'Delete benefit', 'Are you sure you want to delete benefit(s)?',
      'Delete benefit', 'Cancel')
      .subscribe(
        (result) => {
          if(result) {
            for (var i = 0; i < this.benefitsTable.selection.selected.length; i++) {
              let purpose = this.benefitsTable.selection.selected[i];
              this.benefits.forEach( (item, index) => {
                if(item === purpose) this.benefits.splice(index,1);
              });
            }
            this.benefitsTable.updateRows();
            this.clearMappings();
            this.dsa.benefits = [];
            this.dsa.benefits = this.benefits;
            this.updateMappings('Benefits');
          } else {
            this.log.success('Delete cancelled.')
          }
        },
      );
  }

  addBenefit(index: number) {
    const dialogRef = this.dialog.open(PurposeComponent, {
      height: '580px',
      width: '550px',
      data: {resultData: this.benefits, type: 'Benefit', index: index},
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.benefits = result;
        this.benefitsTable.updateRows();
        this.clearMappings();
        this.dsa.benefits = [];
        this.dsa.benefits = this.benefits;
        this.updateMappings('Benefits');
      }
    });
  }

  deleteRegions() {
    MessageBoxDialogComponent.open(this.dialog, 'Remove region', 'Are you sure you want to remove region(s)?',
      'Remove region', 'Cancel')
      .subscribe(
        (result) => {
          if(result) {
            for (var i = 0; i < this.regionsTable.selection.selected.length; i++) {
              let region = this.regionsTable.selection.selected[i];
              this.regions.forEach( (item, index) => {
                if(item === region) this.regions.splice(index,1);
              });
            }
            this.regionsTable.updateRows();
            this.clearMappings();
            this.dsa.regions = {};
            for (const idx in this.regions) {
              const region: Region = this.regions[idx];
              this.dsa.regions[region.uuid] = region.name;
            }
            this.updateMappings('Regions');
          } else {
            this.log.success('Remove cancelled.')
          }
        });
  }

  addRegion() {
    const dialogRef = this.dialog.open(RegionPickerComponent, {
      width: '800px',
      data: { uuid: '', limit: 0, userId : this.activeProject.userId }
    });
    dialogRef.afterClosed().subscribe(result => {
      for (let region of result) {
        if (!this.regions.some(x => x.uuid === region.uuid)) {
          this.regions.push(region);
        }
      }
      this.regionsTable.updateRows();
      this.clearMappings();
      this.dsa.regions = {};
      for (const idx in this.regions) {
        const region: Region = this.regions[idx];
        this.dsa.regions[region.uuid] = region.name;
      }
      this.updateMappings('Regions');
    });
  }

  deleteProjects() {
    MessageBoxDialogComponent.open(this.dialog, 'Remove project', 'Are you sure you want to remove project(s)?',
      'Remove project', 'Cancel')
      .subscribe(
        (result) => {
          if(result) {
            for (var i = 0; i < this.projectsTable.selection.selected.length; i++) {
              let project = this.projectsTable.selection.selected[i];
              this.projects.forEach( (item, index) => {
                if(item === project) this.projects.splice(index,1);
              });
            }
            this.projectsTable.updateRows();
            this.clearMappings();
            this.dsa.projects = {};
            for (const idx in this.projects) {
              const project: Project = this.projects[idx];
              this.dsa.projects[project.uuid] = project.name;
            }
            this.updateMappings('Projects');
          } else {
            this.log.success('Remove cancelled.')
          }
        });
  }

  addProject() {
    const dialogRef = this.dialog.open(ProjectPickerComponent, {
      width: '800px',
      data: { uuid: '', limit: 0, userId : this.activeProject.userId }
    });
    dialogRef.afterClosed().subscribe(result => {
      for (let project of result) {
        if (!this.projects.some(x => x.uuid === project.uuid)) {
          this.projects.push(project);
        }
      }
      this.projectsTable.updateRows();
      this.clearMappings();
      this.dsa.projects = {};
      for (const idx in this.projects) {
        const project: Project = this.projects[idx];
        this.dsa.projects[project.uuid] = project.name;
      }
      this.updateMappings('Projects');
    });
  }

  deletePublishers() {
    MessageBoxDialogComponent.open(this.dialog, 'Remove publisher', 'Are you sure you want to remove publisher(s)?',
      'Remove publisher', 'Cancel')
      .subscribe(
        (result) => {
          if(result) {
            for (var i = 0; i < this.publishersTable.selection.selected.length; i++) {
              let publisher = this.publishersTable.selection.selected[i];
              this.publishers.forEach( (item, index) => {
                if(item === publisher) this.publishers.splice(index,1);
              });
            }
            this.publishersTable.updateRows();
            this.clearMappings();
            this.dsa.publishers = {};
            for (const idx in this.publishers) {
              const publisher: Organisation = this.publishers[idx];
              this.dsa.publishers[publisher.uuid] = publisher.name;
            }
            this.updateMappings('Publishers');
          } else {
            this.log.success('Remove cancelled')
          }
        });
  }

  addPublisher() {
    if (!this.regions[0]) {
      this.log.error('The data sharing agreement must be associated with a region before editing publishers.');
    } else {
      const dialogRef = this.dialog.open(OrganisationPickerComponent, {
        width: '800px',
        data: { searchType: 'organisation', uuid: '', regionUUID: this.regions[0].uuid, dsaUUID: '', existingOrgs: this.publishers }
      });
      dialogRef.afterClosed().subscribe(result => {
        for (let publisher of result) {
          if (!this.publishers.some(x => x.uuid === publisher.uuid)) {
            this.publishers.push(publisher);
          }
        }
        this.publishersTable.updateRows();
        this.clearMappings();
        this.dsa.publishers = {};
        for (const idx in this.publishers) {
          const publisher: Organisation = this.publishers[idx];
          this.dsa.publishers[publisher.uuid] = publisher.name;
        }
        this.updateMappings('Publishers');
      });
    }
  }

  deleteSubscribers() {
    MessageBoxDialogComponent.open(this.dialog, 'Remove subscriber', 'Are you sure you want to remove subscriber(s)?',
      'Remove subscriber', 'Cancel')
      .subscribe(
        (result) => {
          if(result) {
            for (var i = 0; i < this.subscribersTable.selection.selected.length; i++) {
              let subscriber = this.subscribersTable.selection.selected[i];
              this.subscribers.forEach( (item, index) => {
                if(item === subscriber) this.subscribers.splice(index,1);
              });
            }
            this.subscribersTable.updateRows();
            this.clearMappings();
            this.dsa.subscribers = {};
            for (const idx in this.subscribers) {
              const subscriber: Organisation = this.subscribers[idx];
              this.dsa.subscribers[subscriber.uuid] = subscriber.name;
            }
            this.updateMappings('Subscribers');
          } else {
            this.log.success('Remove cancelled.')
          }
        });
  }

  addSubscriber() {
    if (!this.regions[0]) {
      this.log.error('The data sharing agreement must be associated with a region before editing subscribers.');
    } else {
      const dialogRef = this.dialog.open(OrganisationPickerComponent, {
        width: '800px',
        data: { searchType: 'organisation', uuid: '', regionUUID: this.regions[0].uuid, dsaUUID: '', existingOrgs: this.subscribers }
      });
      dialogRef.afterClosed().subscribe(result => {
        for (let subscriber of result) {
          if (!this.subscribers.some(x => x.uuid === subscriber.uuid)) {
            this.subscribers.push(subscriber);
          }
        }
        this.subscribersTable.updateRows();
        this.clearMappings();
        this.dsa.subscribers = {};
        for (const idx in this.subscribers) {
          const subscriber: Organisation = this.subscribers[idx];
          this.dsa.subscribers[subscriber.uuid] = subscriber.name;
        }
        this.updateMappings('Subscribers');
      });
    }
  }

  deleteDocumentations() {
    MessageBoxDialogComponent.open(this.dialog, 'Delete document', 'Are you sure you want to delete document(s)?',
      'Delete document', 'Cancel')
      .subscribe(
        (result) => {
          if(result) {
            for (var i = 0; i < this.documentationsTable.selection.selected.length; i++) {
              let document = this.documentationsTable.selection.selected[i];
              this.documentations.forEach( (item, index) => {
                if(item === document) this.documentations.splice(index,1);
              });
            }
            this.documentationsTable.updateRows();
            this.clearMappings();
            this.dsa.documentations = [];
            this.dsa.documentations = this.documentations;
            this.updateMappings('Documentations');
          } else {
            this.log.success('Delete cancelled.')
          }
        });
  }

  addDocumentation() {
    const dialogRef = this.dialog.open(DocumentationComponent, {
      width: '550px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.documentations.push(result);
        this.documentationsTable.updateRows();
        this.clearMappings();
        this.dsa.documentations = [];
        this.dsa.documentations = this.documentations;
        this.updateMappings('Documentations');
      }
    });
  }

  swapMarkers() {
    if (this.showPub) {
      this.mapMarkers = this.publisherMarkers;
    } else {
      this.mapMarkers = this.subscriberMarkers;
    }
  }

  /*private editDataFlow(item: DataFlow) {
  this.router.navigate(['/dataFlow', item.uuid, 'edit']);
  }

  private editDataFlows() {
  const vm = this;
  DataflowPickerComponent.open(vm.$modal, vm.dataFlows)
    .result.then(function
    (result: DataFlow[]) { vm.dataFlows = result; },
    () => vm.log.info('Edit data flows cancelled')
  );
  }*/

  editDSA() {
    const dialogRef = this.dialog.open(DataSharingAgreementDialogComponent, {
      width: '800px',
      data: {mode: 'edit', uuid: this.dsa.uuid },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dsa = result;
        this.dsaService.saveDsa(this.dsa)
          .subscribe(saved => {
              this.dsa.uuid = saved;
              this.log.success('Data sharing agreement saved.');
            },
            error => this.log.error('The data sharing agreement could not be saved. Please try again.')
          );
      }
    });
  }

  updateMappings(type: string) {
    this.dsaService.updateMappings(this.dsa)
      .subscribe(saved => {
          this.dsa.uuid = saved;
          this.log.success(type + ' updated successfully.');
        },
        error => this.log.error('The DSA could not be saved. Please try again.')
      );
  }

  clearMappings() {
    this.dsa.purposes = null;
    this.dsa.benefits = null;
    this.dsa.regions = null;
    this.dsa.projects = null;
    this.dsa.publishers = null;
    this.dsa.subscribers = null;
    this.dsa.documentations = null;
  }
}
