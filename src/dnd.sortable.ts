// Copyright (C) 2016 Sergey Akopkokhyants
// This project is licensed under the terms of the MIT license.
// https://github.com/akserg/ng2-dnd

import {Injectable} from 'angular2/core';
import {Directive, Input, Output, EventEmitter, ElementRef} from 'angular2/core';

import {AbstractComponent} from './dnd.component';
import {DragDropConfig, DragImage} from './dnd.config';
import {DroppableComponent} from './dnd.droppable';
import {DraggableComponent} from './dnd.draggable';
import {DragDropService, DragDropSortableService} from './dnd.service';

@Directive({ selector: '[dnd-sortable-container]' })
export class SortableContainer extends AbstractComponent {

    @Input("dragEnabled") set draggable(value:boolean) {
        this.dragEnabled = !!value;
    }
    
    private _sortableData: Array<any> = [];

    @Input() set sortableData(sortableData: Array<any>) {
        this._sortableData = sortableData;
        //
        this.dropEnabled = this._sortableData.length === 0;
        // console.log("collection is changed, drop enabled: " + this.dropEnabled);
    }
    get sortableData(): Array<any> {
        return this._sortableData;
    }

    @Input("dropZones") set dropzones(value:Array<string>) {
        this.dropZones = value;
    }

    constructor(elemRef: ElementRef, _dragDropService: DragDropService, _config:DragDropConfig, private _sortableDataService: DragDropSortableService) {
        super(elemRef, _dragDropService, _config);
        this.dragEnabled = false;
    }

    _onDragEnterCallback(event: Event) {
        let item:any = this._sortableDataService.sortableData[this._sortableDataService.index];
        // Check does element exist in sortableData of this Container
        if (this._sortableData.indexOf(item) === -1) {
            // Let's add it
            // console.log('Container._onDragEnterCallback. drag node [' + this._sortableDataService.index.toString() + '] over parent node');
            // Remove item from previouse list
            this._sortableDataService.sortableData.splice(this._sortableDataService.index, 1);
            // Add item to new list
            this._sortableData.push(item);
            this._sortableDataService.sortableData = this._sortableData;
            this._sortableDataService.index = 0;
        }
    }
}

@Directive({ selector: '[dnd-sortable]' })
export class SortableComponent extends AbstractComponent {

    @Input('sortableIndex') index: number;
    
    @Input("dragEnabled") set draggable(value:boolean) {
        this.dragEnabled = !!value;
    }

    @Input("dropEnabled") set droppable(value:boolean) {
        this.dropEnabled = !!value;
    }
    
    /**
     * The data that has to be dragged. It can be any JS object
     */
    @Input() dragData: any;
    
    /**
     * Callback function called when the drag action ends with a valid drop action.
     * It is activated after the on-drop-success callback
     */
    @Output("onDragSuccess") onDragSuccessCallback: EventEmitter<any> = new EventEmitter<any>();
    
    /**
     * Callback function called when the drop action completes correctly.
     * It is activated before the on-drag-success callback.
     */
    @Output("onDropSuccess") onDropSuccessCallback: EventEmitter<any> = new EventEmitter<any>();

    constructor(elemRef: ElementRef, _dragDropService: DragDropService, _config:DragDropConfig, private _sortableContainer: SortableContainer, private _sortableDataService: DragDropSortableService) {
        super(elemRef, _dragDropService, _config);

        this.dropZones = this._sortableContainer.dropZones;
        this.dragEnabled = true;
        this.dropEnabled = true;
    }

    _onDragStartCallback(event: Event) {
        // console.log('_onDragStartCallback. dragging elem with index ' + this.index);
        this._sortableDataService.sortableData = this._sortableContainer.sortableData;
        this._sortableDataService.index = this.index;
        this._sortableDataService.markSortable(this._elem);
        // Add dragData
        this._dragDropService.dragData = this.dragData;
        this._dragDropService.onDragSuccessCallback = this.onDragSuccessCallback;
    }

    _onDragOverCallback(event: Event) {
        if (this._elem != this._sortableDataService.elem) {
            // console.log('_onDragOverCallback. dragging elem with index ' + this.index);
            this._sortableDataService.sortableData = this._sortableContainer.sortableData;
            this._sortableDataService.index = this.index;
            this._sortableDataService.markSortable(this._elem);
        }
    }

    _onDragEndCallback(event: Event) {
        // console.log('_onDragEndCallback. end dragging elem with index ' + this.index);
        this._sortableDataService.sortableData = null;
        this._sortableDataService.index = null;
        this._sortableDataService.markSortable(null);
        // Add dragGata
        this._dragDropService.dragData = null;
        this._dragDropService.onDragSuccessCallback = null;
    }

    _onDragEnterCallback(event: Event) {
        this._sortableDataService.markSortable(this._elem);
        if ((this.index !== this._sortableDataService.index) ||
            (this._sortableDataService.sortableData != this._sortableContainer.sortableData)) {
            // console.log('Component._onDragEnterCallback. drag node [' + this.index + '] over node [' + this._sortableDataService.index + ']');
            // Get item
            let item:any = this._sortableDataService.sortableData[this._sortableDataService.index];
            // Remove item from previouse list
            this._sortableDataService.sortableData.splice(this._sortableDataService.index, 1);
            // Add item to new list
            this._sortableContainer.sortableData.splice(this.index, 0, item);
            this._sortableDataService.sortableData = this._sortableContainer.sortableData;
            this._sortableDataService.index = this.index;
        }
    }
    
    _onDropCallback (event: Event) {
        if (this.onDropSuccessCallback) {
            // console.log('onDropCallback.onDropSuccessCallback.dragData', this._dragDropService.dragData);
            this.onDropSuccessCallback.emit(this._dragDropService.dragData);
        }
        if (this._dragDropService.onDragSuccessCallback) {
            // console.log('onDropCallback.onDragSuccessCallback.dragData', this._dragDropService.dragData);
            this._dragDropService.onDragSuccessCallback.emit(this._dragDropService.dragData);
        }
    }
}