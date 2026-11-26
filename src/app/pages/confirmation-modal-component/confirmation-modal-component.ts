import { Component, effect, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-confirmation-modal-component',
  imports: [],
  templateUrl: './confirmation-modal-component.html',
  styleUrl: './confirmation-modal-component.css',
})
export class ConfirmationModalComponent {
  private fb = inject(FormBuilder);
  isOpen = input.required<boolean>();
  title = input<string>('');
  message = input<string>('');

  dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  confirmed = output<boolean>();

  confirm(): void {
    this.confirmed.emit(true);
  }

  cancel(): void {
    this.confirmed.emit(false);
  }


  constructor() {
    effect(() => {
      const el = this.dialog()?.nativeElement;
      console.log("Dialog: ", el);
      console.log("Open: ", this.isOpen());

      if (!el) return;
      this.isOpen() ? el.showModal() : el.close();

      const open = this.isOpen();

      if (!open) return;

    })
  }

}
