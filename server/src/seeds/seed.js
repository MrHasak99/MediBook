import { supabaseAdmin } from '../utils/supabase.js';

const DOCTORS_DATA = [
  {
    specialty: 'General Practice',
    name: 'Sarah Jenkins',
    email: 'dr.jenkins@medibook.test',
    bio: 'Dedicated general practitioner with over 15 years of experience in family medicine and preventive care.',
    experience: 15,
  },
  {
    specialty: 'Cardiology',
    name: 'Michael Chen',
    email: 'dr.chen@medibook.test',
    bio: 'Board-certified cardiologist specializing in interventional cardiology and cardiovascular health management.',
    experience: 12,
  },
  {
    specialty: 'Dermatology',
    name: 'Elena Rodriguez',
    email: 'dr.rodriguez@medibook.test',
    bio: 'Expert dermatologist focused on medical and cosmetic skin treatments, including advanced laser therapies.',
    experience: 8,
  },
  {
    specialty: 'Orthopedics',
    name: 'David Wilson',
    email: 'dr.wilson@medibook.test',
    bio: 'Specialist in sports medicine and joint replacement surgery, helping patients regain mobility and strength.',
    experience: 20,
  },
  {
    specialty: 'Pediatrics',
    name: 'Aisha Khan',
    email: 'dr.khan@medibook.test',
    bio: 'Compassionate pediatrician providing comprehensive care for infants, children, and adolescents.',
    experience: 10,
  },
  {
    specialty: 'Neurology',
    name: 'James Smith',
    email: 'dr.smith@medibook.test',
    bio: 'Neurologist expert in treating complex neurological disorders, including epilepsy and multiple sclerosis.',
    experience: 14,
  },
  {
    specialty: 'Ophthalmology',
    name: 'Maria Garcia',
    email: 'dr.garcia@medibook.test',
    bio: 'Specializing in cataract surgery and diabetic eye care, dedicated to preserving and improving vision.',
    experience: 11,
  },
  {
    specialty: 'ENT',
    name: 'Robert Taylor',
    email: 'dr.taylor@medibook.test',
    bio: 'Experienced Otolaryngologist treating a wide range of ear, nose, and throat conditions in all age groups.',
    experience: 9,
  },
  {
    specialty: 'Psychiatry',
    name: 'Linda Brown',
    email: 'dr.brown@medibook.test',
    bio: 'Psychiatrist focused on mental wellness, specializing in anxiety, depression, and cognitive behavioral therapy.',
    experience: 13,
  },
  {
    specialty: 'Gynecology',
    name: 'Susan Miller',
    email: 'dr.miller@medibook.test',
    bio: "Specialist in women's reproductive health, prenatal care, and minimally invasive gynecologic surgery.",
    experience: 18,
  },
];

async function seed() {
  console.log('🚀 Starting doctor profile seeding...');

  try {
    // 1. Fetch all specialties
    const { data: specialties, error: specError } = await supabaseAdmin
      .from('specialties')
      .select('id, name');

    if (specError) throw specError;
    if (!specialties || specialties.length === 0) {
      console.log('❌ No specialties found in database. Please run supabase_schema.sql first.');
      return;
    }

    console.log(`Found ${specialties.length} specialties.`);

    for (const docData of DOCTORS_DATA) {
      const specialty = specialties.find((s) => s.name === docData.specialty);
      if (!specialty) {
        console.log(`⚠️  Specialty "${docData.specialty}" not found, skipping.`);
        continue;
      }

      // Check if this auth user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUsers?.users.find((u) => u.email === docData.email);

      let profileId;

      if (user) {
        console.log(`👤 User ${docData.email} already exists.`);
        profileId = user.id;
      } else {
        // Create new auth user — trigger will auto-create the profile row
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: docData.email,
          password: 'password123',
          email_confirm: true,
          user_metadata: { name: docData.name },
        });

        if (createError) {
          console.error(`❌ Error creating user ${docData.email}:`, createError.message);
          continue;
        }

        console.log(`✅ Created user ${docData.email}.`);
        profileId = newUser.user.id;

        // Give the DB trigger a moment to create the profile row
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 2. Ensure profile role is DOCTOR and name is correct
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'DOCTOR', name: docData.name })
        .eq('id', profileId);

      // 3. Upsert the doctor record
      const { data: existingDoctor } = await supabaseAdmin
        .from('doctors')
        .select('id')
        .eq('profile_id', profileId)
        .single();

      if (existingDoctor) {
        console.log(`👨‍⚕️  Doctor record already exists for ${docData.name}. Updating...`);
        await supabaseAdmin
          .from('doctors')
          .update({
            specialty_id: specialty.id,
            bio: docData.bio,
            experience_years: docData.experience,
          })
          .eq('id', existingDoctor.id);
      } else {
        const { error: docError } = await supabaseAdmin.from('doctors').insert({
          profile_id: profileId,
          specialty_id: specialty.id,
          bio: docData.bio,
          experience_years: docData.experience,
        });

        if (docError) {
          console.error(`❌ Error creating doctor record for ${docData.name}:`, docError.message);
        } else {
          console.log(`👨‍⚕️  Created doctor profile for ${docData.name} (${docData.specialty}).`);
        }
      }
    }

    console.log('✨ Seeding complete!');
  } catch (err) {
    console.error('💥 Fatal error during seeding:', err.message);
  }
}

seed();
