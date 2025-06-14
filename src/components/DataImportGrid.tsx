import React, { useState } from 'react';
import DataGrid from './DataGrid';
interface DataImportGridProps {
  title: string;
  description: string;
  headers: string[];
  initialData: string[][];
  onSave: (data: string[][]) => void;
  placeholder?: string;
  cellRenderers?: Record<number, (value: string) => React.ReactNode>;
  selectOptions?: Record<number, string[]>;
  columnTypes?: string[];
  readonly?: boolean;
  hideActions?: boolean;
  currentVersion?: number;
  allowDelete?: boolean;
  allowAdd?: boolean;
}
const DataImportGrid: React.FC<DataImportGridProps> = ({
  title,
  description,
  headers,
  initialData,
  onSave,
  placeholder,
  cellRenderers,
  selectOptions,
  columnTypes,
  readonly = false,
  hideActions = false,
  currentVersion,
  allowDelete,
  allowAdd
}) => {
  const [data, setData] = useState<string[][]>(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const handleDataChange = (newData: string[][]) => {
    setData(newData);
    setHasChanges(true);
  };
  const handleSave = () => {
    onSave(data);
    setHasChanges(false);
  };
  return <div className="bg-white rounded-lg shadow p-6 mb-6 py-[20px]">
      
      
      <div className="mt-4">
        <DataGrid headers={headers} data={data} onChange={handleDataChange} placeholder={placeholder} cellRenderers={cellRenderers} selectOptions={selectOptions} columnTypes={columnTypes} readonly={readonly} hideActions={hideActions} allowDelete={allowDelete} allowAdd={allowAdd} />
      </div>
    </div>;
};
export default DataImportGrid;