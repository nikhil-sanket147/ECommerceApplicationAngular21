import { Injectable, signal } from "@angular/core";
import { ToastMessage, ToastType } from "../models/toast.model";
import { signalGetFn } from "@angular/core/primitives/signals";

@Injectable({
    providedIn: 'root'
})

export class ToastService {
    toasts = signal<ToastMessage[]>([]);

    show(type: ToastType, message: string, title: string,
        duration: number = 3500): void {
            const id = Math.random().toString(36).substring(2, 9);
            const newToast: ToastMessage = {id, type, title,message, duration};
            
            this.toasts.update((current) => [...current, newToast]);
            if(duration > 0){
                setTimeout(() => {
                    this.dismiss(id);
                }, duration);
            }
        }

    success(message:string, title:string = 'Success'): void{
        this.show('success',message, title);
    }

    error(message:string, title: string = 'Error'): void{
        this.show('error', message, title, 5000);
    }

    warning(message:string, title:string = 'Warning'): void{
        this.show('warning', message, title, 4000);
    }

    info(message:string, title:string = 'Info'): void{
        this.show('info', message, title);
    }
    
    dismiss(id: string) {
        throw new Error("Method not implemented.");
    }

    clear(): void{
        this.toasts.set([]);
    }
}