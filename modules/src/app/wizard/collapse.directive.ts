import { Directive, Input, HostBinding, ElementRef, Renderer } from '@angular/core';

/**
 * a directive that controls a toggling between a collapsed and expanded view of the 
 * same data.  
 *
 * This directive is bound to some element containing content intended for the dual view.  
 * When in a collapsed state, the content is not visible; when it is expanded, the content 
 * is fully visible.  
 */
@Directive({
    selector: '[collapse]'
})
export class CollapseDirective {

    layoutCompact: boolean = true;
    layoutMode: string = 'horizontal';
    darkMenu: boolean = false;
    profileMode: string = 'inline';

    constructor(private el : ElementRef, private ren : Renderer) { }

    /**
     * the current height of the target element 
     */
    @HostBinding('style.height')
    public height : string;
    
    /**
     * a flag indicating whether the content is in its exanded state or not
     */
    @HostBinding('class.in')
    @HostBinding('attr.aria-expanded')
    public isExpanded : boolean = true;
    
    /**
     * a flag indicating whether the content is in its collapsed state or not
     */
    @HostBinding('attr.aria-hidden')
    public isCollapsed : boolean = false;

    // stale state
    @HostBinding('class.collapse')
    public isCollapse : boolean = true;

    // animation state
    @HostBinding('class.collapsing')
    public isCollapsing : boolean = false;

    @Input()
    set collapse(value : boolean) {
        this.isExpanded = value;
        this.toggle();
    }

    get collapse() : boolean {
        return this.isExpanded;
    }

    toggle() {
        if (this.isExpanded) {
            this.hide();
        } else {
            this.show();
        }
    }

    hide() {
        this.isCollapse = false;
        this.isCollapsing = true;
      
        this.isExpanded = false;
        this.isCollapsed = true;
        this.ren.setElementStyle(this.el.nativeElement,'display', 'none');
           
        setTimeout(() => {
            this.height = '0';
             
            this.isCollapse = true;
            this.isCollapsing = false;
        }, 4);
    }

    show() {
        this.isCollapse = false;
        this.isCollapsing = true;

        this.isExpanded = true;
        this.isCollapsed = false;
        this.ren.setElementStyle(this.el.nativeElement,'display', 'block');
            
        setTimeout(() => {
            this.height = 'auto';

            this.isCollapse = true;
            this.isCollapsing = false;
        }, 4);
    }
}
