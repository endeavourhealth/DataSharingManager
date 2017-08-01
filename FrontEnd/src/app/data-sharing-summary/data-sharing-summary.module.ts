import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataSharingSummaryComponent } from './data-sharing-summary/data-sharing-summary.component';
import { DataSharingSummaryEditorComponent } from './data-sharing-summary-editor/data-sharing-summary-editor.component';
import { DataSharingSummaryOverviewComponent } from './data-sharing-summary-overview/data-sharing-summary-overview.component';
import {DataSharingSummaryService} from './data-sharing-summary.service';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {EntityViewComponentsModule} from 'eds-angular4';
import {FormsModule} from '@angular/forms';
import { ToastModule } from 'ng2-toastr/ng2-toastr';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    EntityViewComponentsModule,
    ToastModule.forRoot(),
  ],
  declarations: [
    DataSharingSummaryComponent,
    DataSharingSummaryEditorComponent,
    DataSharingSummaryOverviewComponent],
  providers: [DataSharingSummaryService]
})
export class DataSharingSummaryModule { }
