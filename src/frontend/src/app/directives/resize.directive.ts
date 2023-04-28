import { Directive, Input, HostListener, ElementRef } from '@angular/core';
@Directive({
  selector: '[appResize]'
})
export class ResizeDirective {
  @Input('leftResize') leftElement!: HTMLElement
  @Input('rightResize') rightElement!: HTMLElement;
  grabber: boolean = false;
  width!: number;

  constructor(private el: ElementRef<HTMLElement>) { }
  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.width = event.target.outerWidth;
  }
  @HostListener('mousedown') onMouseDown() {
    this.grabber = true;
    this.el.nativeElement.classList.add('side-panel');
    this.el.nativeElement.classList.add('grabber-elevated');
    document.body.style.cursor = 'e-resize';
  }

  @HostListener('window:mouseup') onMouseUp(event: any) {
    this.grabber = false;
    this.el.nativeElement.classList.remove('side-panel');
    this.el.nativeElement.classList.remove('grabber-elevated');
    document.body.style.cursor = 'default';
  }

  @HostListener('window:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    if (this.grabber) {
      event.preventDefault();
      let growSize = `calc(100% - ${event.clientX - 3}px`;
      let shrinkSize = `${event.clientX - 3}px`;

      if (event.movementX > 0) {
        this.rightElement.style.flex = `0 1 ${growSize}`;
        this.leftElement.style.flex = `1 1 ${shrinkSize}`;
      } else {
        this.leftElement.style.flex = `0 1 ${shrinkSize}`;
        this.rightElement.style.flex = `1 1 ${growSize}`;
      }
    }
  }
}