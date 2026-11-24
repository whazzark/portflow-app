"""Human gates, read from a git ref: a spec or a design is approved once it is on main."""
import re

from .common import Failure, git, pad_issue
from .specs import parse_frontmatter


def files_at_ref(ref, prefix):
    return git("ls-tree", "-r", "--name-only", ref, "--", prefix).splitlines()


def spec_path_at_ref(issue, ref):
    pattern = re.compile(rf"^specs/{pad_issue(issue)}-[a-z0-9-]+/spec\.md$")
    matches = [f for f in files_at_ref(ref, "specs/") if pattern.match(f)]
    if not matches:
        raise Failure([
            f"gate 'spec': no approved spec for #{issue} on {ref}. "
            "The spec PR must be merged by a human before any code is written."
        ])
    return matches[0]


def check_spec_approved(issue, ref):
    return spec_path_at_ref(issue, ref)


def check_design_approved(issue, ref):
    spec_file = spec_path_at_ref(issue, ref)
    meta, _ = parse_frontmatter(git("show", f"{ref}:{spec_file}"))
    if (meta or {}).get("ui_impact") != "yes":
        return "not required (ui_impact is not 'yes')"
    design_prefix = spec_file.rsplit("/", 1)[0] + "/design/"
    # brief.md is written before the mock-up exists: it does not pass the gate.
    export = [f for f in files_at_ref(ref, design_prefix) if f != design_prefix + "brief.md"]
    if not export:
        raise Failure([
            f"gate 'design': #{issue} has ui_impact 'yes' but {design_prefix} holds no mock-up export on {ref}. "
            "The design PR must be merged by a human before any front-end code is written."
        ])
    return design_prefix
