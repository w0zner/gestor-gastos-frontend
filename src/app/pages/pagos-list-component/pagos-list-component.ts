import { Component, inject, signal } from '@angular/core';
import { PagosService } from '../../services/pagos-service';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { collection, Firestore } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { forkJoin } from 'rxjs';

interface Pago {
  id: string;
  anho: number;
  mes: number;
  concepto: string;
  monto_estimado: number;
  monto_pagado: number;
  dia_vencimiento: number;
  fecha_pago: any;
  notas: string;
  estado: string;
  categoria: string;
}

@Component({
  selector: 'app-pagos-list-component',
  templateUrl: './pagos-list-component.html',
  styleUrl: './pagos-list-component.css',
  imports: [DatePipe]
})
export class PagosListComponent {
  private pagosService = inject(PagosService);
  private router = inject(Router);
  private auth = inject(Auth);

  categoriasMap: { [key: string]: any } = {};
  estadosMap: { [key: string]: any } = {};

  listaPagos = signal<Pago[]>([]);
  cantidadPagos = signal(0);

  ngOnInit(): void {
    forkJoin({
      pagos: this.pagosService.getPagos(),
      categorias: this.pagosService.getCategorias(),
      estados: this.pagosService.getEstados()
    })
      .subscribe({
        next: ({ pagos, categorias, estados }) => {

          categorias.forEach((c: any) => {
            this.categoriasMap[c.id] = c;
          });

          estados.forEach((e: any) => {
            this.estadosMap[e.id] = e;
          });

          const lista = pagos.map((pago: any) => {

            const catId = pago.categoria?.id;
            const estId = pago.estado?.id;

            console.log(catId)

            const catObj = this.categoriasMap[catId];
            const estObj = this.estadosMap[estId];

            return {
              ...pago,
              nombreCategoria: catObj ? catObj.nombre : 'Sin categoría',
              nombreEstado: estObj ? estObj.nombre : 'Sin estado'
            };
          })

          this.listaPagos.set(lista);
          this.cantidadPagos.set(this.listaPagos().length);
          console.log(lista);
        },
        error: (error: any) => {
          console.error(error);
        },
      });

  }


}
