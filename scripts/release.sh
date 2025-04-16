set -euo pipefail

base="$(dirname $0)"

new_version=$(yq '.version' "$base"/../package.json -oy)
yq ".version=\"$new_version\"" "$base"/../manifest.json -ioj

min_app=$(yq '.minAppVersion' "$base"/../manifest.json -oy)

yq ".\"$new_version\" = \"$min_app\"" "$base"/../versions.json -ioj

dist_dir="$base/../dist"

OUTPUT="$dist_dir" PROJECT_DIR="$(realpath -e "$base/..")" node "$base"/esbuild.config.mjs production

git -C "$base/.." add './package.json'
git -C "$base/.." add './manifest.json'
git -C "$base/.." add './versions.json'
git -C "$base/.." commit -m "Release $new_version"
git -C "$base/.." push
git -C "$base/.." tag "$new_version" origin
git -C "$base/.." push --tags

gh release create "$new_version" --fail-on-no-commits --verify-tag --title "$new_version" --notes "" \
	"$base"/../manifest.json \
	"$dist_dir"/main.js \
	"$dist_dir"/styles.css
