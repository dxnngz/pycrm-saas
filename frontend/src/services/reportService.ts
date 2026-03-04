import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Client, Opportunity } from '../types';

/**
 * Service to generate professional PDF reports for the TFG PyCRM project.
 */
export const generatePipelineReport = (opportunities: Opportunity[]) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241); // Primary color
    doc.text('PyCRM: Informe de Pipeline', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${date}`, 14, 30);
    doc.text('Generado por: PyCRM AI Intelligence System', 14, 35);

    // Summary Box
    const totalAmount = opportunities.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
    const wonAmount = opportunities.filter(o => o.status === 'ganado').reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 45, 180, 25, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Valor Total Pipeline: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalAmount)}`, 20, 55);
    doc.text(`Ventas Cerradas (Ganado): ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(wonAmount)}`, 20, 62);

    // Table
    const tableData = opportunities.map(o => [
        o.client_company || '',
        o.client_name || '',
        o.product || '',
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(o.amount),
        o.status.toUpperCase()
    ]);

    autoTable(doc, {
        startY: 80,
        head: [['Empresa', 'Contacto', 'Producto', 'Importe', 'Estado']],
        body: tableData,
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { fontSize: 9, cellPadding: 4 },
        margin: { top: 80 },
    });

    // Footer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - PyCRM Enterprise Solution`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`PyCRM_Pipeline_Report_${date.replace(/\//g, '-')}.pdf`);
};

export const generateClientReport = (clients: Client[]) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text('PyCRM: Directorio de Socios', 14, 22);

    const tableData = clients.map(c => [
        c.name,
        c.company,
        c.email,
        c.phone || 'N/A'
    ]);

    autoTable(doc, {
        startY: 40,
        head: [['Nombre', 'Empresa', 'Email', 'Teléfono']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
    });

    doc.save(`PyCRM_Clientes_Report_${date.replace(/\//g, '-')}.pdf`);
};
