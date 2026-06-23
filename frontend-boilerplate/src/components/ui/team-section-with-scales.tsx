import { motion } from "motion/react"
import { Scales } from "@/components/ui/scales"
import { cn } from "@/shared/lib/utils"
import type {
  TeamSectionWithScalesProps,
  TeamMember,
  TeamMemberSocial,
} from "@/components/ui/team-section-with-scales-types"

function SocialLink({ social }: { social: TeamMemberSocial }) {
  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.label}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {social.icon ?? (
        <span className="text-xs font-medium uppercase tracking-wide">
          {social.label}
        </span>
      )}
    </a>
  )
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <motion.div
      data-slot="team-member-card"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-card p-8 text-center",
        "transition-colors hover:border-foreground/20",
      )}
    >
      <Scales
        orientation="diagonal"
        size={12}
        className="opacity-60"
        color="color-mix(in oklab, var(--foreground) 8%, transparent)"
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border border-border bg-muted"
        >
          <img
            src={member.image}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <h3 className="text-base font-semibold text-foreground">
          {member.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>

        {member.bio ? (
          <p className="mt-3 max-w-xs text-sm text-muted-foreground/80">
            {member.bio}
          </p>
        ) : null}

        {member.socials && member.socials.length > 0 ? (
          <div className="mt-4 flex items-center gap-4">
            {member.socials.map((social, i) => (
              <SocialLink key={`${social.label}-${i}`} social={social} />
            ))}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function TeamSectionWithScales({
  eyebrow = "Nosso time",
  title = "Conheça quem faz acontecer",
  description = "Um grupo de pessoas apaixonadas por construir produtos de qualidade.",
  members,
  className,
  ...rest
}: TeamSectionWithScalesProps) {
  return (
    <section
      data-slot="team-section-with-scales"
      className={cn("w-full px-4 py-16", className)}
      {...rest}
    >
      <div className="mx-auto max-w-2xl text-center">
        {eyebrow ? (
          <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-base text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, i) => (
          <MemberCard key={`${member.name}-${i}`} member={member} />
        ))}
      </div>
    </section>
  )
}

export { TeamSectionWithScales }
