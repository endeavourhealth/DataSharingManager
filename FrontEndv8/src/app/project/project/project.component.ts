import {Component, OnInit, ViewChild} from '@angular/core';
import {Project} from "../models/Project";
import {UserProject} from "dds-angular8/lib/user-manager/models/UserProject";
import {Router} from "@angular/router";
import {GenericTableComponent, LoggerService, MessageBoxDialogComponent, UserManagerService} from "dds-angular8";
import {ProjectService} from "../project.service";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {

  @ViewChild('projectsTable', {static: false}) projectsTable: GenericTableComponent;

  projects: Project[];
  pageNumber = 1;
  pageSize = 20;
  orderColumn = 'name';
  descending = false;
  allowEdit = false;
  projectDetailsToShow = new Project().getDisplayItems();
  superUser = false;
  userId: string;
  loadingComplete = false;

  public activeProject: UserProject;

  constructor(private projectService: ProjectService,
              private router: Router,
              private userManagerNotificationService: UserManagerService,
              private log: LoggerService,
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
    this.getProjects(this.userId);
  }

  getProjects(userId: string) {
    this.loadingComplete = false;
    this.projectService.getAllProjects(userId)
      .subscribe(
        result => {
          this.projects = result;
          this.loadingComplete = true;
        },
        error => {
          this.log.error('The projects could not be loaded. Please try again.');
          this.loadingComplete = true;
        }
      );
  }

  add() {
    this.router.navigate(['/project', 1, 'add']);
  }

  edit(item: Project) {
    this.router.navigate(['/project', item.uuid, 'edit']);
  }

  itemClicked(item: Project) {
    this.router.navigate(['/project', item.uuid, 'edit']);
  }

  delete() {
    MessageBoxDialogComponent.open(this.dialog, 'Delete project', 'Are you sure you want to delete project(s)?',
      'Delete project', 'Cancel')
      .subscribe(
        (result) => {
          if(result) {
            for (var i = 0; i < this.projectsTable.selection.selected.length; i++) {
              let project = this.projectsTable.selection.selected[i];
              this.projects.forEach( (item, index) => {
                if(item === project) {
                  this.projectService.deleteProject(project.uuid).subscribe(
                    () => {
                      this.projects.splice(index,1);
                      this.projectsTable.updateRows();
                    }
                  );
                }
              });
            }
            this.log.success('Delete successful.');
          } else {
            this.log.success('Delete cancelled.')
          }
        });
  }

  close() {
    this.router.navigate(['/overview']);
  }


}
