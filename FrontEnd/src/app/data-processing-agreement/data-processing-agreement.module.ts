import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataProcessingAgreementComponent } from './data-processing-agreement/data-processing-agreement.component';
import { DataProcessingAgreementEditorComponent } from './data-processing-agreement-editor/data-processing-agreement-editor.component';
import { DataProcessingAgreementPickerComponent } from './data-processing-agreement-picker/data-processing-agreement-picker.component';
import {DataProcessingAgreementService} from './data-processing-agreement.service';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {EntityViewComponentsModule, LoggerService} from 'eds-angular4';
import {FormsModule} from '@angular/forms';
import { ToastModule } from 'ng2-toastr/ng2-toastr';
import {DocumentationService} from '../documentation/documentation.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    EntityViewComponentsModule,
    ToastModule.forRoot(),
  ],
  declarations: [
    DataProcessingAgreementComponent,
    DataProcessingAgreementEditorComponent,
    DataProcessingAgreementPickerComponent],
  providers: [
    DataProcessingAgreementService,
    DocumentationService,
    LoggerService]
})
export class DataProcessingAgreementModule { }
