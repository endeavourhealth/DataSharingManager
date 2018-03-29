import {Component, OnInit, ViewContainerRef} from '@angular/core';
import {DataFlowService} from '../data-flow.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DataFlow} from '../models/DataFlow';
import {DataSharingAgreementPickerComponent} from '../../data-sharing-agreement/data-sharing-agreement-picker/data-sharing-agreement-picker.component';
import {DataProcessingAgreementPickerComponent} from '../../data-processing-agreement/data-processing-agreement-picker/data-processing-agreement-picker.component';
import {Dsa} from '../../data-sharing-agreement/models/Dsa';
import {Dpa} from '../../data-processing-agreement/models/Dpa';
import {LoggerService, SecurityService} from 'eds-angular4';
import {ActivatedRoute, Router} from '@angular/router';
import {ToastsManager} from "ng2-toastr";
import {Documentation} from "../../documentation/models/Documentation";
import {DocumentationService} from "../../documentation/documentation.service";

@Component({
  selector: 'app-data-flow-editor',
  templateUrl: './data-flow-editor.component.html',
  styleUrls: ['./data-flow-editor.component.css']
})
export class DataFlowEditorComponent implements OnInit {
  private paramSubscriber: any;
  public accordionClass = 'accordionClass';

  dataFlow: DataFlow = <DataFlow>{};
  dsas: Dsa[];
  dpas: Dpa[];
  documentations: Documentation[];
  allowEdit = false;
  file: File;
  pdfSrc: any;

  flowDirections = [
    {num: 0, name : 'Inbound'},
    {num: 1, name : 'Outbound'}
  ];

  flowSchedules = [
    {num: 0, name : 'Daily'},
    {num: 1, name : 'On Demand'}
  ];

  exchangeMethod = [
    {num: 0, name : 'Paper'},
    {num: 1, name : 'Electronic'}
  ];

  flowStatus = [
    {num: 0, name : 'In Development'},
    {num: 1, name : 'Live'}
  ];

  storageProtocols = [
    {num: 0, name: 'Audit only'},
    {num: 1, name: 'Temporary Store And Forward'},
    {num: 2, name: 'Permanent Record Store'}
  ];

  securityArchitectures = [
    {num: 0, name: 'TLS/MA'},
    {num: 1, name: 'Secure FTP'}
  ];

  securityInfrastructures = [
    {num: 0, name: 'N3'},
    {num: 1, name: 'PSN'},
    {num: 2, name: 'Internet'}
  ];

  dsaDetailsToShow = new Dsa().getDisplayItems();
  dpaDetailsToShow = new Dpa().getDisplayItems();
  documentDetailsToShow = new Documentation().getDisplayItems();


  constructor(private $modal: NgbModal,
              private log: LoggerService,
              private dataFlowService: DataFlowService,
              private securityService: SecurityService,
              private documentationService: DocumentationService,
              private router: Router,
              private route: ActivatedRoute,
              public toastr: ToastsManager, vcr: ViewContainerRef) {
    this.toastr.setRootViewContainerRef(vcr);
  }

  ngOnInit() {
    this.checkEditPermission();
    this.paramSubscriber = this.route.params.subscribe(
      params => {
        this.performAction(params['mode'], params['id']);
      });
  }

  checkEditPermission() {
    const vm = this;
    if (vm.securityService.hasPermission('eds-dsa-manager', 'eds-dsa-manager:admin'))
      vm.allowEdit = true;
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
    this.dataFlow = {
      name : ''
    } as DataFlow;
  }

  load(uuid: string) {
    const vm = this;
    vm.dataFlowService.getDataFlow(uuid)
      .subscribe(result =>  {
          vm.dataFlow = result;
          vm.getLinkedDpas();
          vm.getLinkedDsas();
          vm.getAssociatedDocumentation();
        },
        error => vm.log.error('Error loading', error, 'Error')
      );
  }

  save(close: boolean) {
    const vm = this;
    // Populate Data Sharing Agreements before save
    vm.dataFlow.dsas = {};
    for (let idx in this.dsas) {
      const dsa: Dsa = this.dsas[idx];
      this.dataFlow.dsas[dsa.uuid] = dsa.name;
    }

    // Populate Data Processing Agreements before save
    vm.dataFlow.dpas = {};
    for (let idx in this.dpas) {
      const dpa: Dpa = this.dpas[idx];
      this.dataFlow.dpas[dpa.uuid] = dpa.name;
    }

    // Populate documents before save
    vm.dataFlow.documentations = [];
    vm.dataFlow.documentations = vm.documentations;

    vm.dataFlowService.saveDataFlow(vm.dataFlow)
      .subscribe(saved => {
          vm.dataFlow.uuid = saved;
          vm.log.success('Data Flow saved', vm.dataFlow, 'Saved');
          if (close) { vm.close(); }
        },
        error => vm.log.error('Error saving Data Flow', error, 'Error')
      );
  }

  close() {
    window.history.back();
  }


  toNumber() {
    this.dataFlow.directionId = +this.dataFlow.directionId;
    console.log(this.dataFlow.directionId);
  }

  private editDataSharingAgreements() {
    const vm = this;
    DataSharingAgreementPickerComponent.open(vm.$modal, vm.dsas)
      .result.then(function
      (result: Dsa[]) { vm.dsas = result; },
      () => vm.log.info('Edit Data Sharing Agreements cancelled')
    );
  }

  private editDataProcessingAgreements() {
    const vm = this;
    DataProcessingAgreementPickerComponent.open(vm.$modal, vm.dpas)
      .result.then(function
      (result: Dpa[]) { vm.dpas = result; },
      () => vm.log.info('Edit Data Processing Agreements cancelled')
    );
  }

  private editDataSharingAgreement(item: Dsa) {
    this.router.navigate(['/dsa', item.uuid, 'edit']);
  }

  private editDataProcessingAgreement(item: Dpa) {
    this.router.navigate(['/dsa', item.uuid, 'edit']);
  }

  private getLinkedDpas() {
    const vm = this;
    vm.dataFlowService.getLinkedDpas(vm.dataFlow.uuid)
      .subscribe(
        result => vm.dpas = result,
        error => vm.log.error('Failed to load linked Data Processing Agreement', error, 'Load Linked Data Processing Agreement')
      );
  }

  private getLinkedDsas() {
    const vm = this;
    vm.dataFlowService.getLinkedDsas(vm.dataFlow.uuid)
      .subscribe(
        result => vm.dsas = result,
        error => vm.log.error('Failed to load linked Data Sharing Agreement', error, 'Load Linked Data Sharing Agreement')
      );
  }

  private getAssociatedDocumentation() {
    const vm = this;
    vm.documentationService.getAllAssociatedDocuments(vm.dataFlow.uuid, '4')
      .subscribe(
        result => vm.documentations = result,
        error => vm.log.error('Failed to load associated documentation', error, 'Load associated documentation')
      );
  }

  delete($event) {
    console.log($event);
  }

  fileChange(event) {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.file = fileList[0];
    } else {
      this.file = null;
    }
  }

  ok() {
    this.uploadFile();
  }

  cancel() {
    this.file = null;
  }

  private uploadFile() {
    const vm = this;
    const myReader: FileReader = new FileReader();

    myReader.onloadend = function(e){
      // you can perform an action with readed data here
      vm.log.success('Uploading file', null, 'Upload');
      vm.pdfSrc = myReader.result;
      const newDoc: Documentation = new Documentation();
      newDoc.fileData = myReader.result;
      newDoc.title = vm.file.name;
      newDoc.filename = vm.file.name;
      vm.documentations.push(newDoc);
    }


    myReader.readAsDataURL(vm.file);
  }

}
