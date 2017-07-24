import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {DataSet} from '../models/Dataset';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {DataSetService} from '../data-set.service';
import {LoggerService} from 'eds-angular4';

@Component({
  selector: 'app-data-set-picker',
  templateUrl: './data-set-picker.component.html',
  styleUrls: ['./data-set-picker.component.css']
})
export class DataSetPickerComponent implements OnInit {
  @Input() resultData: DataSet[];
  searchData: string;
  searchResults: DataSet[];
  @ViewChild('search') searchInput;

  public static open(modalService: NgbModal, dataSets: DataSet[]) {
    const modalRef = modalService.open(DataSetPickerComponent, { backdrop : 'static'});
    modalRef.componentInstance.resultData = dataSets;

    return modalRef;
  }

  constructor(public activeModal: NgbActiveModal,
              private log: LoggerService,
              private dataSetService: DataSetService) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.searchInput.nativeElement.focus();
  }

  private search() {
    const vm = this;
    if (vm.searchData.length < 3)
      return;
    vm.dataSetService.search(vm.searchData)
      .subscribe(
        (result) => vm.searchResults = result,
        (error) => vm.log.error(error)
      );
  }

  private addToSelection(match: DataSet) {
    /*if ($.grep(this.resultData, function(o: DataSet) { return o.uuid === match.uuid; }).length === 0)
      this.resultData.push(match);*/
  }

  private removeFromSelection(match: DataSet) {
    const index = this.resultData.indexOf(match, 0);
    if (index > -1) {
      this.resultData.splice(index, 1);
    }
  }

  ok() {
    this.activeModal.close(this.resultData);
    console.log('OK Pressed');
  }

  cancel() {
    this.activeModal.dismiss('cancel');
    console.log('Cancel Pressed');
  }

}
