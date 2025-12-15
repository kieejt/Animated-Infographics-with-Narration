import { useProject } from '../context/ProjectContext';
import Papa from 'papaparse';
import { Upload, FileText } from 'lucide-react';

export default function CsvUploader() {
    const { setCsvData, setColumns, csvData } = useProject();

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                setCsvData(results.data);
                if (results.meta.fields) {
                    setColumns(results.meta.fields);
                }
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
            }
        });
    };

    if (csvData) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                        <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900">CSV Loaded Successfully</h3>
                        <p className="text-sm text-green-700">{csvData.length} rows imported</p>
                    </div>
                </div>
                <button
                    onClick={() => { setCsvData(null); setColumns([]); }}
                    className="text-sm text-green-700 hover:text-green-900 font-medium underline"
                >
                    Upload Different File
                </button>
            </div>
        );
    }

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-2 font-medium">Upload Data Source</p>
            <p className="text-sm text-gray-500 mb-6">Drag and drop your CSV file here</p>
            <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium shadow hover:bg-blue-700 transition pointer-events-none">
                Select CSV File
            </button>
        </div>
    );
}
