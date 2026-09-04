interface Person {
  name: string;
  photo?: string;
  program: string;
  school: string;
  roles: string[];
  email: string;
  facebook?: string;
}

const developers: Person[] = [
  {
    name: "Samson B. Branzuela II",
    photo: "/samson.jpg",
    program: "Bachelor of Science in Civil Engineering",
    school: "South East Asian Institute of Technology (SEAIT)",
    roles: ["Programmer", "Website Developer"],
    email: "samsonbranzuela21@gmail.com",
    facebook: "facebook.com/samsonbranzuela21",
  },
  {
    name: "Maria Sol C. Gimenez",
    photo: "/mariasol.jpg",
    program: "Bachelor of Science in Civil Engineering",
    school: "South East Asian Institute of Technology (SEAIT)",
    roles: ["Web Designer", "Content Developer"],
    email: "mariasolcambrijan05@gmail.com",
    facebook: "facebook.com/mariasolgimenez01",
  },
];

const adviser: Person = {
  name: "Engr. Mark Vincent C. Garrido",
  photo: "/adviser.jpg",
  program: "Faculty, Civil Engineering Department",
  school: "South East Asian Institute of Technology (SEAIT)",
  roles: ["Thesis Adviser"],
  email: "adviser@seait.edu.ph",
};

function PersonCard({ person }: { person: Person }) {
  const initials = person.name
    .split(" ")
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#4d7cff] bg-[var(--bg-surface)] text-[24px] font-bold text-[var(--text-muted)]">
        {person.photo ? (
          <img
            src={person.photo}
            alt={person.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      <h3 className="mt-4 text-[15px] font-bold text-[#4d7cff]">{person.name}</h3>
      <p className="mt-1 text-[11px] italic text-[var(--text-muted)]">{person.program}</p>
      <p className="text-[11px] italic text-[var(--text-muted)]">{person.school}</p>

      <div className="mt-2">
        {person.roles.map((role) => (
          <p key={role} className="text-[11px] font-semibold text-[var(--text)]">
            {role}
          </p>
        ))}
      </div>

      <a href={`mailto:${person.email}`} className="mt-3 text-[11px] text-[#4d7cff] hover:underline">
        ✉ {person.email}
      </a>
      {person.facebook && (
        <a href={`https://${person.facebook}`} target="_blank" rel="noopener noreferrer" className="mt-1 text-[11px] text-[#4d7cff] hover:underline">
          f {person.facebook}
        </a>
      )}
    </div>
  );
}

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-16 text-[var(--text)]">
      <div className="mx-auto max-w-[480px]">
        <h1 className="text-center text-[28px] font-extrabold text-[#4d7cff]">
          Developers
        </h1>

        <div className="mt-10 flex flex-col gap-14">
          {developers.map((dev) => (
            <PersonCard key={dev.name} person={dev} />
          ))}
        </div>

        <div className="mt-16 border-t border-[var(--border)] pt-10">
          <h2 className="text-center text-[20px] font-extrabold text-[#4d7cff]">
            Adviser
          </h2>
          <div className="mt-8">
            <PersonCard person={adviser} />
          </div>
        </div>
      </div>
    </div>
  );
}