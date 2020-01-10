import {Component, OnInit, ViewChild} from '@angular/core';
import {UserProject} from "dds-angular8/lib/user-manager/models/UserProject";
import {Project} from "src/app/project/models/Project";
import {LoggerService, UserManagerService} from "dds-angular8";
import {ActivatedRoute, Router} from "@angular/router";
import {DatePipe} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {ProjectService} from "../project.service";
import {User} from "../models/User";
import {Dsa} from "../../data-sharing-agreement/models/Dsa";
import {Organisation} from "../../organisation/models/Organisation";
import {GenericTableComponent} from "../../generic-table/generic-table/generic-table.component";
import {Documentation} from "../../documentation/models/Documentation";
import {DocumentationComponent} from "../../documentation/documentation/documentation.component";
import {DocumentationService} from "../../documentation/documentation.service";

@Component({
  selector: 'app-project-editor',
  templateUrl: './project-editor.component.html',
  styleUrls: ['./project-editor.component.scss']
})
export class ProjectEditorComponent implements OnInit {

  @ViewChild('dsasTable', { static: false }) purposesTable: GenericTableComponent;
  @ViewChild('publishersTable', { static: false }) publishersTable: GenericTableComponent;
  @ViewChild('subscribersTable', { static: false }) subscribersTable: GenericTableComponent;
  @ViewChild('documentationsTable', { static: false }) documentationsTable: GenericTableComponent;

  project: Project;
  public activeProject: UserProject;
  private paramSubscriber: any;
  allowEdit = false;
  superUser = false;
  userId: string;
  disableStatus = false;
  userList: User[] = [];
  dsas: Dsa[] = [];
  dsasDetailsToShow = new Dsa().getDisplayItems();
  publishers: Organisation[] = [];
  publishersDetailsToShow = new Organisation().getDisplayItems();
  subscribers: Organisation[] = [];
  documentations: Documentation[] = [];
  documentationsDetailsToShow = new Documentation().getDisplayItems();

  businessCaseStatuses = [
    {num: 0, name: 'Submitted'},
    {num: 1, name: 'Approved'}
  ];

  storageProtocols = [
    {num: 0, name: 'Audit only'},
    {num: 1, name: 'Temporary Store And Forward'},
    {num: 2, name: 'Permanent Record Store'}
  ];

  consents = [
    {num: 0, name : 'Explicit Consent'},
    {num: 1, name : 'Implied Consent'}
  ];

  deidentificationLevel = [
    {num: 0, name: 'Patient identifiable data'},
    {num: 1, name: 'Pseudonymised data'}
  ];

  projectTypes = [
    {num: 0, name: 'Extract'},
    {num: 1, name: 'Query'}
  ];

  flowScheduleIds = [
    {num: 0, name: 'Daily'},
    {num: 1, name: 'On Demand'},
    {num: 2, name: 'Weekly'},
    {num: 3, name: 'Monthly'},
    {num: 4, name: 'Annually'},
    {num: 5, name: 'One off'},
    {num: 6, name: 'Quarterly'}
  ];

  outputFormat = [
    {num: 0, name: 'FHIR'},
    {num: 1, name: 'CSV'}
  ];

  securityInfrastructures = [
    {num: 0, name: 'N3'},
    {num: 1, name: 'PSN'},
    {num: 1, name: 'Internet'}
  ];

  securityArchitectures = [
    {num: 0, name: 'TLS/MA'},
    {num: 1, name: 'Secure FTP'}
  ];

  status = [
    {num: 0, name : 'Active'},
    {num: 1, name : 'Inactive'}
  ];


  constructor(private log: LoggerService,
              private projectService: ProjectService,
              private documentationService: DocumentationService,
              private router: Router,
              private route: ActivatedRoute,
              private datePipe: DatePipe,
              private userManagerService: UserManagerService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.userManagerService.onProjectChange.subscribe(active => {
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
    this.project = {
      name : ''
    } as Project;
  }

  load(uuid: string) {
    this.projectService.getProject(uuid)
      .subscribe(result =>  {
          this.project = result;
          this.project.startDate = this.datePipe.transform(this.project.startDate,"yyyy-MM-dd");
          this.project.endDate = this.datePipe.transform(this.project.endDate,"yyyy-MM-dd");
          this.checkEndDate();
          this.getDsas();
          this.getPublishers();
          this.getSubscribers();
          this.getDocumentations();
        },
        error => this.log.error('The data processing agreement could not be loaded. Please try again.')
      );
  }

  checkEndDate() {
    if (this.project.endDate === null) {
      this.disableStatus = false;
      return;
    }

    let today = new Date();
    today.setHours(0,0,0,0);
    let endDate = new Date(this.project.endDate);

    if (endDate < today) {
      this.project.projectStatusId = 1;
      this.disableStatus = true;
    } else {
      this.disableStatus = false;
    }
  }

  getDsas() {
    this.projectService.getLinkedDsas(this.project.uuid)
      .subscribe(
        result => {
          this.dsas = result;
        },
        error => this.log.error('The associated data sharing agreements could not be loaded. Please try again.')
      );
  }

  dsaClicked(item: Dsa) {
    this.router.navigate(['/dsa', item.uuid, 'edit']);
  }

  deleteDsas() {
    for (var i = 0; i < this.dsasTable.selection.selected.length; i++) {
      let purpose = this.dsasTable.selection.selected[i];
      this.dsas.forEach( (item, index) => {
        if(item === purpose) this.dsas.splice(index,1);
      });
    }
    this.dsasTable.updateRows();  }

  addDsa() {
    this.router.navigate(['/dsa', 1, 'add']);
  }

  getPublishers() {
    this.projectService.getLinkedPublishers(this.project.uuid)
      .subscribe(
        result => this.publishers = result,
        error => this.log.error('The associated publishers could not be loaded. Please try again.')
      );
  }

  publisherClicked(item: Organisation) {
    this.router.navigate(['/organisation', item.uuid, 'edit']);
  }

  deletePublishers() {
    for (var i = 0; i < this.publishersTable.selection.selected.length; i++) {
      let purpose = this.publishersTable.selection.selected[i];
      this.publishers.forEach( (item, index) => {
        if(item === purpose) this.publishers.splice(index,1);
      });
    }
    this.publishersTable.updateRows();
  }

  addPublisher() {
    this.router.navigate(['/organisation', 1, 'add']);
  }

  getSubscribers() {
    this.projectService.getLinkedSubscribers(this.project.uuid)
      .subscribe(
        result => this.subscribers = result,
        error => this.log.error('The associated publishers could not be loaded. Please try again.')
      );
  }

  deleteSubscribers() {
    for (var i = 0; i < this.subscribersTable.selection.selected.length; i++) {
      let purpose = this.subscribersTable.selection.selected[i];
      this.subscribers.forEach( (item, index) => {
        if(item === purpose) this.subscribers.splice(index,1);
      });
    }
    this.subscribersTable.updateRows();
  }

  getDocumentations() {
    this.documentationService.getAllAssociatedDocuments(this.project.uuid, '14')
      .subscribe(
        result => this.documentations = result,
        error => this.log.error('The associated documentation could not be loaded. Please try again.')
      );
  }

  deleteDocumentations() {
    for (var i = 0; i < this.documentationsTable.selection.selected.length; i++) {
      let purpose = this.documentationsTable.selection.selected[i];
      this.documentations.forEach( (item, index) => {
        if(item === purpose) this.documentations.splice(index,1);
      });
    }
    this.documentationsTable.updateRows();
  }

  addDocumentation() {
    const dialogRef = this.dialog.open(DocumentationComponent, {
      height: '350px',
      width: '550px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.documentations.push(result);
        this.documentationsTable.updateRows();
      }
    });
  }

}
