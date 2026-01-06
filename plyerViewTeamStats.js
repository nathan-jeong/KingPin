const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentTeamId = localStorage.getItem('teamId');
let currentUserId = localStorage.getItem('userId');
let teamData = [];
let sortState = {
    column: null,
    ascending: true
};

/
