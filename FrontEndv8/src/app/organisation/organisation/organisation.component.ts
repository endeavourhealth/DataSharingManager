import { Component, OnInit } from '@angular/core';
import {Organisation} from '../../models/Organisation';
import {OrganisationService} from '../organisation.service';
import {ActivatedRoute, Router} from '@angular/router';
import {UserProject} from "dds-angular8/lib/user-manager/models/UserProject";
import {LoggerService, UserManagerService} from "dds-angular8";

@Component({
  selector: 'app-organisation',
  templateUrl: './organisation.component.html',
  styleUrls: ['./organisation.component.css']
})
export class OrganisationComponent implements OnInit {
  private paramSubscriber: any;
  organisations: Organisation[];
  modeType: string;
  searchData = '';
  searchType: string;
  totalItems = 5;
  pageNumber = 1;
  pageSize = 20;
  orderColumn = 'name';
  descending = false;
  allowEdit = false;
  orgDetailsToShow = new Organisation().getDisplayItems();
  loadingComplete = false;

  public activeProject: UserProject;

  ngOnInit() {
    this.userManagerNotificationService.onProjectChange.subscribe(active => {
      this.activeProject = active;
      this.roleChanged();
    });
  }

  roleChanged() {


    if (this.activeProject.applicationPolicyAttributes.find(x => x.applicationAccessProfileName == 'Admin') != null) {
      this.allowEdit = true;
    } else {
      this.allowEdit = false;
    }

    this.paramSubscriber = this.route.params.subscribe(
      params => {
        this.performAction(params['mode']);
      });
  }

  constructor(private organisationService: OrganisationService,
              private router: Router,
              private route: ActivatedRoute,
              private userManagerNotificationService: UserManagerService,
              private log: LoggerService,) {
  }

  protected performAction(mode: string) {
    switch (mode) {
      case 'organisations':
        this.modeType = 'Organisation';
        this.searchType = 'organisation';
        this.search();
        this.getTotalOrganisationCount();
        break;
      case 'services':
        this.modeType = 'Service';
        this.searchType = 'services';
        this.search();
        this.getTotalOrganisationCount();
        break;
    }
  }

  getTotalOrganisationCount() {

    this.organisationService.getTotalCount(this.searchData, this.searchType)
      .subscribe(
        (result) => {
          this.totalItems = result;
          console.log(result);
        },
        (error) => console.log(error)
      );
  }

  add() {
    if (this.modeType === 'Organisation') {
      this.router.navigate(['/organisation', 1, 'add']);
    } else {
      this.router.navigate(['/organisation', 1, 'addService']);
    }
  }

  edit(item: Organisation) {
    this.router.navigate(['/organisation', item.uuid, 'edit']);
  }

  delete(items: Organisation[]) {

    console.log(items);
    /*MessageBoxDialog.open(this.$modal, 'Delete organisation', 'Are you sure that you want to delete <b>' + item.name + '</b>?', 'Delete organisation', 'Cancel')
      .result.then(
      () => this.doDelete(item),
      () => this.log.info('Delete cancelled')
    );*/
  }

  doDelete(item: Organisation) {
    /*
    this.organisationService.deleteOrganisation(item.uuid)
      .subscribe(
        () => {
          this.search();
          this.log.success('Organisation deleted')/!*, item, 'Delete organisation')*!/;
        },
        (error) => this.log.error('The organisation could not be deleted. Please try again.'/!*, error, 'Delete organisation'*!/)
      );*/
  }

  close() {
    this.router.navigate(['/overview']);
  }

  onSearch($event) {

    this.searchData = $event;
    this.pageNumber = 1;
    this.organisations = [];
    this.search();
    this.getTotalOrganisationCount();
  }

  private search() {

    this.loadingComplete = false;
    console.log('searching', this.pageNumber);
    this.organisationService.search(this.searchData, this.searchType, this.pageNumber, this.pageSize, this.orderColumn, this.descending)
      .subscribe(result => {
          this.organisations = result;
          console.log(result);
          this.loadingComplete = true;
        },
        error => {
          this.log.error('The organisation could not be loaded. Please try again.'/*, error, 'Load organisations'*/);
          this.loadingComplete = true;
        }
      );
  }

  itemClicked(org: Organisation) {
    console.log(org);
    this.router.navigate(['/organisation', org.uuid, 'edit']);
  }

  pageChange($event) {
    this.pageNumber = $event.pageIndex + 1; // pagination index starts at 0, mySQL is 1
    this.pageSize = $event.pageSize;
    this.search();
  }

  onOrderChange($event) {
    this.orderColumn = $event.active;
    this.descending = $event.direction == 'desc' ? true : false;
    this.search();
  }
}
