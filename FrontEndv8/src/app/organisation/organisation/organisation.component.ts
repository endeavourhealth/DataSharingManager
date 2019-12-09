import { Component, OnInit } from '@angular/core';
import {Organisation} from '../models/Organisation';
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

    this.search();
    this.getTotalOrganisationCount();
    console.log('here');
    this.userManagerNotificationService.onProjectChange.subscribe(active => {
      this.activeProject = active;
      console.log(active);
      this.roleChanged();
    });


  }

  roleChanged() {
    const vm = this;

    if (vm.activeProject.applicationPolicyAttributes.find(x => x.applicationAccessProfileName == 'Admin') != null) {
      vm.allowEdit = true;
    } else {
      vm.allowEdit = false;
    }

    console.log(vm.allowEdit);

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
    const vm = this;
    vm.organisationService.getTotalCount(vm.searchData, vm.searchType)
      .subscribe(
        (result) => {
          vm.totalItems = result;
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

  delete(item: Organisation) {
    const vm = this;
    /*MessageBoxDialog.open(vm.$modal, 'Delete organisation', 'Are you sure that you want to delete <b>' + item.name + '</b>?', 'Delete organisation', 'Cancel')
      .result.then(
      () => vm.doDelete(item),
      () => vm.log.info('Delete cancelled')
    );*/
  }

 /* doDelete(item: Organisation) {
    const vm = this;
    vm.organisationService.deleteOrganisation(item.uuid)
      .subscribe(
        () => {
          vm.search();
          vm.log.success('Organisation deleted')/!*, item, 'Delete organisation')*!/;
        },
        (error) => vm.log.error('The organisation could not be deleted. Please try again.'/!*, error, 'Delete organisation'*!/)
      );
  }*/

  close() {
    this.router.navigate(['/overview']);
  }

  onSearch($event) {
    const vm = this;
    vm.searchData = $event;
    vm.pageNumber = 1;
    vm.organisations = [];
    vm.search();
    vm.getTotalOrganisationCount();
  }

  private search() {
    console.log('searching');
    const vm = this;
    vm.loadingComplete = false;
    vm.organisationService.search(vm.searchData, vm.searchType, vm.pageNumber, vm.pageSize, vm.orderColumn, vm.descending)
      .subscribe(result => {
          vm.organisations = result;
          console.log(result);
          vm.loadingComplete = true;
        },
        error => {
          vm.log.error('The organisation could not be loaded. Please try again.'/*, error, 'Load organisations'*/);
          vm.loadingComplete = true;
        }
      );
  }

  pageChange($event) {
    const vm = this;
    vm.pageNumber = $event;
    vm.search();
  }

  pageSizeChange($event) {
    const vm = this;
    vm.pageSize = $event;
    vm.search();
  }

  onOrderChange($event) {
    const vm = this;
    vm.orderColumn = $event.column;
    vm.descending = $event.descending;
    vm.search();
  }
}
