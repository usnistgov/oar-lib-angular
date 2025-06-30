import { Component, ChangeDetectorRef, HostListener, Input, ElementRef } from '@angular/core';
import { state, style, trigger, transition, animate } from '@angular/animations';

/**
 * A Panel that includes a sidebar that can be opened and closed.  When it is opened,
 * it pushes content out of the way (as opposed to covering over it).
 */
@Component({
    selector: 'oar-pushing-sidebar',
    templateUrl: 'pushingsidebar.component.html',
    styleUrls: ['pushingsidebar.component.scss'],
    animations: [
        trigger("togglesbar", [
            state('sbarvisible', style({
                opacity: 1,
                "height": "*"
            })),
            state('sbarhidden', style({
                opacity: 0,
                "height": "0px",
                "overflow": "auto"
            })),
            transition('sbarvisible <=> sbarhidden', [
                animate('0.1s')
            ]),
            state('mainsquished', style({
                "width": "{{prevSplitterPosition}}px"
            }), { params: { prevSplitterPosition: 500 } }),
            state('mainexpanded', style({
                "width": "100%"
            })),
            transition('mainsquished <=> mainexpanded', [
                animate('0.1s')
            ])
        ])
    ]
})
export class PushingSidebarComponent {
    @Input() marginLeft: number = 20;

    private _sbarvisible : boolean = true;
    private isResizing = false;
    private leftRatio = 0.7;
    currentSplitterPosition: number = window.innerWidth / 2 + this.marginLeft;
    prevSplitterPosition: number = this.currentSplitterPosition;

    constructor(private chref: ChangeDetectorRef, private el: ElementRef) { }

    ngAfterViewInit() {
        this.updateLeftWidth();
    }

    /**
     * toggle whether the sidebar is visible.  When this is called, a change in
     * in the visiblity of the sidebar will be animated (either opened or closed).
     */
    toggleSbarView() {
        this._sbarvisible = ! this._sbarvisible;
        this.chref.detectChanges();
    }

    isSbarVisible() {
        return this._sbarvisible
    }

    get mainPanelState() {
        return this.isSbarVisible() ? 'mainsquished' : 'mainexpanded';
    }

    get leftWidth() {
        return this.currentSplitterPosition - this.marginLeft;
    }

    startResize(event: MouseEvent) {
        this.isResizing = true;
        event.preventDefault();
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
      if (this.isResizing) {
        this.currentSplitterPosition = event.clientX;
        this.prevSplitterPosition = this.currentSplitterPosition;
        this.leftRatio = this.currentSplitterPosition / this.el.nativeElement.querySelector('.oar-psidebar-panel-root').clientWidth;
      }
    }
  
    @HostListener('document:mouseup')
    stopResize() {
      this.isResizing = false;
    }

    @HostListener('window:resize')
    onWindowResize() {
      this.updateLeftWidth();
    }
  
    private updateLeftWidth() {
        const containerWidth = this.el.nativeElement.querySelector('.oar-psidebar-panel-root').clientWidth;
        this.currentSplitterPosition = containerWidth * this.leftRatio;
        this.prevSplitterPosition = this.currentSplitterPosition;
    }
}
