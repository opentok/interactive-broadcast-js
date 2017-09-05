// @flow
const origin = window.location.origin;

const createEmbed = (userType: UserRole, adminId: string): string => {
  if (!adminId) { return ''; }
  return `<div id="show"></div>
          <script src="${origin}/embed.js"></script>
          <script>
            IBSApp.init({
            adminId: '${adminId}',
            container: '#show',
            userType: '${userType}',
            width: '600', 
            height: '400', 
            fitMode: 'contain'
          });
          </script>`;
};

export default createEmbed;
