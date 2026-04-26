import { supabaseAdmin } from '../utils/supabase.js';

const USERS = [
  {
    email: 'patient@medibook.test',
    password: 'patient',
    name: 'Patient User',
    role: 'PATIENT',
  },
  {
    email: 'doctor@medibook.test',
    password: 'doctor',
    name: 'Doctor User',
    role: 'DOCTOR',
  },
  {
    email: 'admin@medibook.test',
    password: 'admin',
    name: 'Admin User',
    role: 'ADMIN',
  },
];

async function seedBasicUsers() {
  console.log('🚀 Starting basic users seeding...');

  try {
    for (const userData of USERS) {
      // 1. Check if user already exists in auth
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      let user = users.find((u) => u.email === userData.email);
      let userId;

      if (user) {
        console.log(`👤 User ${userData.email} already exists.`);
        userId = user.id;
        
        // Update password just in case
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: userData.password,
          user_metadata: { name: userData.name }
        });
      } else {
        // Create new auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: { name: userData.name },
        });

        if (createError) {
          console.error(`❌ Error creating user ${userData.email}:`, createError.message);
          continue;
        }

        console.log(`✅ Created user ${userData.email}.`);
        userId = newUser.user.id;

        // Give the DB trigger a moment to create the profile row
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 2. Update profile role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: userData.role, name: userData.name })
        .eq('id', userId);

      if (profileError) {
        console.error(`❌ Error updating profile for ${userData.email}:`, profileError.message);
      } else {
        console.log(`🛡️  Role set to ${userData.role} for ${userData.email}.`);
      }

      // 3. If DOCTOR, ensure entry in doctors table
      if (userData.role === 'DOCTOR') {
        const { data: specialties } = await supabaseAdmin.from('specialties').select('id').limit(1);
        const specialtyId = specialties?.[0]?.id;

        const { data: existingDoctor } = await supabaseAdmin
          .from('doctors')
          .select('id')
          .eq('profile_id', userId)
          .single();

        if (!existingDoctor) {
          const { error: docError } = await supabaseAdmin.from('doctors').insert({
            profile_id: userId,
            specialty_id: specialtyId,
            bio: 'Default doctor profile for testing.',
            experience_years: 5,
          });

          if (docError) {
            console.error(`❌ Error creating doctor record:`, docError.message);
          } else {
            console.log('👨‍⚕️  Doctor record created.');
          }
        }
      }
    }

    console.log('✨ Basic users seeding complete!');
  } catch (err) {
    console.error('💥 Fatal error during seeding:', err.message);
  }
}

seedBasicUsers();
