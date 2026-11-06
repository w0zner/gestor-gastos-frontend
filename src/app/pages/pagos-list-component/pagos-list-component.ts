import { Component, inject, signal } from '@angular/core';
import { PagosService } from '../../services/pagos-service';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

interface Pago {
  id: string;
  anho: number;
  mes: number;
  concepto: string;
  monto_estimado: number;
  monto_pagado: number;
  dia_vencimiento: number;
  fecha_pago: string;
  notas: string;
  estado: string;
  categoria: string;
}

@Component({
  selector: 'app-pagos-list-component',
  templateUrl: './pagos-list-component.html',
  styleUrl: './pagos-list-component.css',
})
export class PagosListComponent {
  private pagosService = inject(PagosService);
  private router = inject(Router);
  private auth = inject(Auth);

  listaPagos = signal<Pago[]>([]);
  cantidadPagos = signal(0);

  ngOnInit(): void {
    this.pagosService.getPagos().subscribe({
      next: (response: any) => {
        this.listaPagos.set(response);
        this.cantidadPagos.set(this.listaPagos().length);
        console.log(this.listaPagos());
      },
      error: (error: any) => {
        console.error(error);
      },
    });
  }


}
