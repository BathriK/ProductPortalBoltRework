
import React from 'react';
import NotesEditSection from '../EditSections/NotesEditSection';

interface NotesTabProps {
  productId: string;
}

const NotesTab: React.FC<NotesTabProps> = ({ productId }) => {
  return <NotesEditSection productId={productId} />;
};

export default NotesTab;
