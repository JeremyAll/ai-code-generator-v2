'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AllowedUser {
  id: string;
  email: string;
  invite_code: string;
  added_by: string;
  added_at: string;
  is_active: boolean;
  notes: string;
}

export default function WhitelistAdmin() {
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newCode, setNewCode] = useState('TONCODE2024');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAllowedUsers();
  }, []);

  const loadAllowedUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('allowed_users')
      .select('*')
      .order('added_at', { ascending: false });
    
    if (data) setAllowedUsers(data);
    if (error) setMessage('Erreur lors du chargement: ' + error.message);
    setLoading(false);
  };

  const addUser = async () => {
    if (!newEmail) {
      setMessage('Email requis');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('allowed_users')
      .insert({
        email: newEmail,
        invite_code: newCode,
        added_by: 'admin',
        notes: newNotes
      });

    if (error) {
      setMessage('Erreur: ' + error.message);
    } else {
      setMessage('Utilisateur ajouté avec succès');
      loadAllowedUsers();
      setNewEmail('');
      setNewNotes('');
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('allowed_users')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (error) {
      setMessage('Erreur: ' + error.message);
    } else {
      setMessage('Statut modifié');
      loadAllowedUsers();
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    const { error } = await supabase
      .from('allowed_users')
      .delete()
      .eq('id', id);
    
    if (error) {
      setMessage('Erreur: ' + error.message);
    } else {
      setMessage('Utilisateur supprimé');
      loadAllowedUsers();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🛡️ Whitelist Management</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Erreur') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {message}
          </div>
        )}

        {/* Add new user */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-xl text-white mb-4">➕ Ajouter un utilisateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              required
            />
            <input
              type="text"
              placeholder="Code d'invitation"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Notes (optionnel)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
            <button
              onClick={addUser}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>

        {/* Users list */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl text-white mb-4">👥 Utilisateurs autorisés ({allowedUsers.length})</h2>
          
          {loading && (
            <div className="text-center text-gray-400 py-8">Chargement...</div>
          )}

          {!loading && allowedUsers.length === 0 && (
            <div className="text-center text-gray-400 py-8">Aucun utilisateur trouvé</div>
          )}

          <div className="space-y-3">
            {allowedUsers.map((user) => (
              <div key={user.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{user.email}</p>
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Code: <span className="text-blue-400">{user.invite_code}</span></p>
                  <p className="text-gray-400 text-sm">
                    Ajouté le {new Date(user.added_at).toLocaleDateString('fr-FR')} par {user.added_by}
                  </p>
                  {user.notes && (
                    <p className="text-gray-400 text-sm italic">Notes: {user.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={() => toggleActive(user.id, user.is_active)}
                    className={`px-3 py-1 rounded text-sm ${
                      user.is_active 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {user.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={loadAllowedUsers}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>
    </div>
  );
}